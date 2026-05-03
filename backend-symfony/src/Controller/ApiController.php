<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\Journal;
use App\Entity\Emotion;
use App\Entity\Appointment;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Response;

#[Route('/api')]
class ApiController
{
    private $em;

    public function __construct(EntityManagerInterface $em)
    {
        $this->em = $em;
    }

    #[Route('/users', name: 'api_users', methods: ['GET'])]
    public function getUsers(): JsonResponse
    {
        $users = $this->em->getRepository(User::class)->findAll();
        $data = [];
        foreach ($users as $user) {
            $data[] = [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'displayName' => $user->getDisplayName(),
                'role' => $user->getRole(),
                'avatarUrl' => $user->getAvatarUrl(),
                'createdAt' => $user->getCreatedAt()->format('Y-m-d H:i:s'),
            ];
        }
        return new JsonResponse($data);
    }

    #[Route('/users/{id}', name: 'api_user_show', methods: ['GET'])]
    public function getUser(string $id): JsonResponse
    {
        $user = $this->em->getRepository(User::class)->find($id);
        if (!$user) {
            return new JsonResponse(['error' => 'User not found'], 404);
        }
        return new JsonResponse([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'displayName' => $user->getDisplayName(),
            'role' => $user->getRole(),
            'avatarUrl' => $user->getAvatarUrl(),
            'createdAt' => $user->getCreatedAt()->format('Y-m-d H:i:s'),
        ]);
    }

    #[Route('/journals', name: 'api_journals', methods: ['GET'])]
    public function getJournals(Request $request): JsonResponse
    {
        $userId = $request->query->get('userId');
        $criteria = $userId ? ['userId' => $userId] : [];
        $journals = $this->em->getRepository(Journal::class)->findBy($criteria, ['createdAt' => 'DESC']);
        
        $data = [];
        foreach ($journals as $journal) {
            $data[] = [
                'id' => $journal->getId(),
                'userId' => $journal->getUserId(),
                'content' => $journal->getContent(),
                'moodScore' => $journal->getMoodScore(),
                'isPrivate' => $journal->isIsPrivate(),
                'createdAt' => $journal->getCreatedAt()->format('Y-m-d H:i:s'),
            ];
        }
        return new JsonResponse($data);
    }

    #[Route('/journals', name: 'api_journals_create', methods: ['POST'])]
    public function createJournal(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        $journal = new Journal();
        $journal->setUserId($data['userId']);
        $journal->setContent($data['content']);
        $journal->setMoodScore($data['moodScore'] ?? null);
        $journal->setIsPrivate($data['isPrivate'] ?? true);
        
        $this->em->persist($journal);
        $this->em->flush();
        
        return new JsonResponse([
            'id' => $journal->getId(),
            'message' => 'Journal created successfully',
        ], 201);
    }

    #[Route('/emotions', name: 'api_emotions', methods: ['GET'])]
    public function getEmotions(Request $request): JsonResponse
    {
        $userId = $request->query->get('userId');
        $criteria = $userId ? ['userId' => $userId] : [];
        $emotions = $this->em->getRepository(Emotion::class)->findBy($criteria, ['createdAt' => 'DESC']);
        
        $data = [];
        foreach ($emotions as $emotion) {
            $data[] = [
                'id' => $emotion->getId(),
                'userId' => $emotion->getUserId(),
                'score' => $emotion->getScore(),
                'notes' => $emotion->getNotes(),
                'createdAt' => $emotion->getCreatedAt()->format('Y-m-d H:i:s'),
            ];
        }
        return new JsonResponse($data);
    }

    #[Route('/emotions', name: 'api_emotions_create', methods: ['POST'])]
    public function createEmotion(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        $emotion = new Emotion();
        $emotion->setUserId($data['userId']);
        $emotion->setScore($data['score']);
        $emotion->setNotes($data['notes'] ?? null);
        
        $this->em->persist($emotion);
        $this->em->flush();
        
        return new JsonResponse([
            'id' => $emotion->getId(),
            'message' => 'Emotion recorded successfully',
        ], 201);
    }

    #[Route('/appointments', name: 'api_appointments', methods: ['GET'])]
    public function getAppointments(Request $request): JsonResponse
    {
        $userId = $request->query->get('userId');
        $criteria = $userId ? ['patientId' => $userId] : [];
        $appointments = $this->em->getRepository(Appointment::class)->findBy($criteria, ['dateTime' => 'ASC']);
        
        $data = [];
        foreach ($appointments as $appointment) {
            $data[] = [
                'id' => $appointment->getId(),
                'patientId' => $appointment->getPatientId(),
                'therapistId' => $appointment->getTherapistId(),
                'dateTime' => $appointment->getDateTime()->format('Y-m-d H:i:s'),
                'status' => $appointment->getStatus(),
                'type' => $appointment->getType(),
            ];
        }
        return new JsonResponse($data);
    }

    #[Route('/appointments', name: 'api_appointments_create', methods: ['POST'])]
    public function createAppointment(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        $appointment = new Appointment();
        $appointment->setPatientId($data['patientId']);
        $appointment->setTherapistId($data['therapistId'] ?? null);
        $appointment->setDateTime(new \DateTimeImmutable($data['dateTime']));
        $appointment->setStatus($data['status'] ?? 'pending');
        $appointment->setType($data['type'] ?? 'general');
        
        $this->em->persist($appointment);
        $this->em->flush();
        
        return new JsonResponse([
            'id' => $appointment->getId(),
            'message' => 'Appointment created successfully',
        ], 201);
    }

    #[Route('/health', name: 'api_health', methods: ['GET'])]
    public function health(): JsonResponse
    {
        return new JsonResponse(['status' => 'healthy', 'database' => 'mindcare_dbai']);
    }
}
