<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class DashboardController extends AbstractController
{
    #[Route('/{reactRouting}', name: 'app_dashboard', requirements: ['reactRouting' => '^(?!api).+'], defaults: ['reactRouting' => null])]
    public function index(): Response
    {
        // This controller serves the React Application Entry point
        // In a real migration, Twig would render base.html.twig which includes the Vite build
        return $this->render('dashboard/index.html.twig', [
            'controller_name' => 'DashboardController',
        ]);
    }
}
