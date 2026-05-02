<?php

namespace App\Controller;

use App\Entity\EmotionNode;
use App\Repository\EmotionNodeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/v1', name: 'api_')]
class NeuralKernelController extends AbstractController
{
    #[Route('/health', name: 'health', methods: ['GET'])]
    public function healthCheck(): JsonResponse
    {
        return $this->json([
            'status' => 'STABLE',
            'kernel' => 'Symfony 6.4',
            'timestamp' => time()
        ]);
    }

    #[Route('/emotions', name: 'emotions_list', methods: ['GET'])]
    public function listEmotions(Request $request, EmotionNodeRepository $repository): JsonResponse
    {
        $userId = $request->query->get('userId');
        if (!$userId) {
            return $this->json(['error' => 'Missing userId'], 400);
        }

        $emotions = $repository->findBy(['userId' => $userId], ['createdAt' => 'DESC'], 50);
        
        return $this->json($emotions);
    }

    #[Route('/emotions', name: 'emotions_create', methods: ['POST'])]
    public function createEmotion(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        $node = new EmotionNode();
        $node->setUserId($data['userId']);
        $node->setScore($data['score']);
        $node->setNotes($data['notes'] ?? null);
        $node->setCreatedAt(new \DateTimeImmutable());

        $em->persist($node);
        $em->flush();

        return $this->json($node, 201);
    }
}
