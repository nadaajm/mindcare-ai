<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/v1/clinic', name: 'clinic_')]
class ClinicController extends AbstractController
{
    #[Route('/stats', name: 'stats', methods: ['GET'])]
    public function getClinicStats(): JsonResponse
    {
        // Mock data for clinic throughput
        return $this->json([
            'total_clinics' => 12,
            'active_therapists' => 45,
            'sessions_today' => 128,
            'availability_score' => 0.94
        ]);
    }

    #[Route('/list', name: 'list', methods: ['GET'])]
    public function listClinics(): JsonResponse
    {
        return $this->json([
            ['id' => 1, 'name' => 'Serenity Central', 'region' => 'London'],
            ['id' => 2, 'name' => 'Neural North', 'region' => 'Manchester'],
            ['id' => 3, 'name' => 'Calm Coast', 'region' => 'Brighton']
        ]);
    }
}
