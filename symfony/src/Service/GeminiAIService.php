<?php

namespace App\Service;

use Symfony\Component\HttpClient\HttpClient;
use Symfony\Component\HttpClient\Exception\ClientExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Psr\Log\LoggerInterface;

class GeminiAIService
{
    private HttpClientInterface $httpClient;
    private string $apiKey;
    private LoggerInterface $logger;
    private bool $available;

    private const MODEL_CHAT = 'gemini-1.5-flash';
    private const MODEL_ANALYSIS = 'gemini-3-flash-preview';

    public function __construct(HttpClientInterface $httpClient, string $geminiApiKey, LoggerInterface $logger)
    {
        $this->httpClient = $httpClient;
        $this->apiKey = $geminiApiKey;
        $this->logger = $logger;
        $this->available = !empty($geminiApiKey);
    }

    public function isAvailable(): bool
    {
        return $this->available;
    }

    private function getIntelligentChatResponse(string $message): string
    {
        $lowerMsg = strtolower($message);

        // Crisis detection
        if (str_contains($lowerMsg, 'suicide') || str_contains($lowerMsg, 'kill myself') || str_contains($lowerMsg, 'end my life')) {
            return "I am deeply concerned about what you are going through. Please reach out to a professional or a crisis helpline immediately. In many places, you can call 988 or your local emergency services. You are not alone.";
        }

        $emotionKeywords = [
            'happy' => ['happy', 'joy', 'excited', 'great', 'wonderful', 'amazing'],
            'sad' => ['sad', 'unhappy', 'depressed', 'miserable', 'down', 'blue'],
            'anxious' => ['anxious', 'worried', 'nervous', 'stressed', 'panic', 'fear'],
        ];

        $emotionCounts = [];
        foreach ($emotionKeywords as $emotion => $keywords) {
            $emotionCounts[$emotion] = count(array_filter($keywords, fn($k) => str_contains($lowerMsg, $k)));
        }

        arsort($emotionCounts);
        $dominantEmotion = key($emotionCounts);

        $responses = match($dominantEmotion) {
            'happy' => ["That's wonderful to hear! What's been contributing to your positive mood lately?", "I'm glad you're feeling good!"],
            'sad' => ["I hear that you're feeling sad, and that's okay.", "Thank you for sharing your sadness with me."],
            'anxious' => ["I can sense the anxiety in your words.", "What grounding techniques usually help you?"],
            default => ["Thank you for sharing that. How does it make you feel?", "That's important. Tell me more."]
        };

        return $responses[array_rand($responses)];
    }

    public function analyzeJournal(string $content): array
    {
        if (!$this->available) {
            $lowerContent = strtolower($content);
            $happyWords = ['happy', 'joy', 'excited', 'great'];
            $sadWords = ['sad', 'depressed', 'down'];
            $anxiousWords = ['anxious', 'worried', 'stressed'];

            $happyCount = count(array_filter($happyWords, fn($w) => str_contains($lowerContent, $w)));
            $sadCount = count(array_filter($sadWords, fn($w) => str_contains($lowerContent, $w)));
            $anxiousCount = count(array_filter($anxiousWords, fn($w) => str_contains($lowerContent, $w)));

            $sentiment = match (true) {
                $happyCount > $sadCount && $happyCount > $anxiousCount => 'Happy',
                $sadCount > $happyCount && $sadCount > $anxiousCount => 'Sad',
                $anxiousCount > $happyCount && $sadCount > $happyCount => 'Anxious',
                default => 'Neutral'
            };

            return [
                'sentiment' => $sentiment,
                'stressLevel' => 5,
                'happinessLevel' => 5,
                'anxietyLevel' => 5,
                'advice' => 'Keep tracking your feelings. This is a safe space.',
                'isCrisis' => str_contains($lowerContent, 'suicide') || str_contains($lowerContent, 'kill myself')
            ];
        }

        try {
            $response = $this->httpClient->request('POST', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' . $this->apiKey, [
                'json' => [
                    'contents' => [[
                        'parts' => [[
                            'text' => "Analyze this mental health journal entry: \"$content\". Return JSON: {\"sentiment\":\"Happy\"|\"Sad\"|\"Anxious\"|\"Neutral\",\"stressLevel\":0-10,\"happinessLevel\":0-10,\"anxietyLevel\":0-10,\"advice\":\"...\",\"isCrisis\":true|false}"
                        ]]
                    ]],
                    'generationConfig' => ['response_mime_type' => 'application/json']
                ]
            ]);

            $result = json_decode($response->getContent(false), true);
            return $result['candidates'][0]['content']['parts'][0]['text'] ?? $this->getFallbackAnalysis();
        } catch (ClientExceptionInterface | \JsonException $e) {
            $this->logger->error('Gemini analysis failed: ' . $e->getMessage());
            return $this->getFallbackAnalysis();
        }
    }

    public function getChatResponse(string $message, array $history = []): string
    {
        if (!$this->available) {
            return $this->getIntelligentChatResponse($message);
        }

        try {
            $response = $this->httpClient->request('POST', 'https://generativelanguage.googleapis.com/v1beta/models/' . self::MODEL_CHAT . ':generateContent?key=' . $this->apiKey, [
                'json' => [
                    'contents' => array_merge(
                        array_map(fn($h) => ['role' => $h['role'], 'parts' => [['text' => $h['content']]]], $history),
                        [['parts' => [['text' => $message]]]]
                    ),
                    'generationConfig' => [
                        'temperature' => 0.7,
                        'topK' => 40,
                        'topP' => 0.95,
                        'maxOutputTokens' => 256,
                    ]
                ]
            ]);

            $result = json_decode($response->getContent(false), true);
            return $result['candidates'][0]['content']['parts'][0]['text'] ?? $this->getIntelligentChatResponse($message);
        } catch (ClientExceptionInterface | \JsonException $e) {
            $this->logger->error('Gemini chat failed: ' . $e->getMessage());
            return $this->getIntelligentChatResponse($message);
        }
    }

    private function getFallbackAnalysis(): array
    {
        return [
            'sentiment' => 'Neutral',
            'stressLevel' => 5,
            'happinessLevel' => 5,
            'anxietyLevel' => 5,
            'advice' => 'Keep tracking your feelings. This is a safe space.',
            'isCrisis' => false
        ];
    }
}

