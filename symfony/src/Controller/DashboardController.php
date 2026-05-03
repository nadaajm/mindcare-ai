<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class DashboardController extends AbstractController
{
    #[Route('/dashboard', name: 'dashboard', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function index(EntityManagerInterface $em): Response
    {
        /** @var User $user */
        $user = $this->getUser();

        $emotions = $em->getRepository(\App\Entity\Emotion::class)->findBy(['user' => $user]);
        $journals = $em->getRepository(\App\Entity\Journal::class)->findBy(['user' => $user]);

        $moodScores = array_filter(array_map(fn($j) => $j->getMoodScore(), $journals));
        $averageMood = !empty($moodScores) ? array_sum($moodScores) / count($moodScores) : 5;

        return $this->render('dashboard/index.html.twig', [
            'user' => $user,
            'emotions' => $emotions,
            'journals' => $journals,
            'averageMood' => $averageMood,
        ]);
    }
}

