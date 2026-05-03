<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Uid\Ulid;

#[Route('/api', name: 'api_')]
class ApiUserController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserRepository $userRepository,
        private UserPasswordHasherInterface $passwordHasher,
        private SerializerInterface $serializer,
        private ValidatorInterface $validator
    ) {}

    #[Route('/users', name: 'api_users_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $users = $this->userRepository->findAll();
        $data = $this->serializer->normalize($users, 'json', ['groups' => 'user:read']);
        return $this->json($data);
    }

    #[Route('/users/{id}', name: 'api_users_show', methods: ['GET'])]
    public function show(Ulid $id): JsonResponse
    {
        $user = $this->userRepository->find($id);
        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }
        $data = $this->serializer->normalize($user, 'json', ['groups' => 'user:read']);
        return $this->json($data);
    }

    #[Route('/users', name: 'api_users_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->serializer->deserialize($request->getContent(), User::class, 'json', ['groups' => 'user:write']);
        
        $errors = $this->validator->validate($user);
        if (count($errors) > 0) {
            $messages = [];
            foreach ($errors as $error) {
                $messages[] = $error->getMessage();
            }
            return $this->json(['errors' => $messages], 400);
        }

        $user->setPassword($this->passwordHasher->hashPassword($user, $user->getPassword()));
        $user->setRoles(['ROLE_PATIENT']);
        $user->setCreatedAt(new \DateTimeImmutable());

        $this->em->persist($user);
        $this->em->flush();

        $data = $this->serializer->normalize($user, 'json', ['groups' => 'user:read']);
        return $this->json($data, 201);
    }

    #[Route('/users/{id}', name: 'api_users_update', methods: ['PUT', 'PATCH'])]
    public function update(Request $request, Ulid $id): JsonResponse
    {
        $user = $this->userRepository->find($id);
        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        $data = json_decode($request->getContent(), true);
        if ($data['password']) {
            $user->setPassword($this->passwordHasher->hashPassword($user, $data['password']));
        }

        foreach (['email', 'displayName', 'avatarUrl'] as $field) {
            if (isset($data[$field])) {
                $setter = 'set' . ucfirst($field);
                $user->$setter($data[$field]);
            }
        }

        $errors = $this->validator->validate($user);
        if (count($errors) > 0) {
            $messages = [];
            foreach ($errors as $error) {
                $messages[] = $error->getMessage();
            }
            return $this->json(['errors' => $messages], 400);
        }

        $this->em->flush();

        $data = $this->serializer->normalize($user, 'json', ['groups' => 'user:read']);
        return $this->json($data);
    }

    #[Route('/users/{id}', name: 'api_users_delete', methods: ['DELETE'])]
    public function delete(Ulid $id): JsonResponse
    {
        $user = $this->userRepository->find($id);
        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        $this->em->remove($user);
        $this->em->flush();

        return $this->json(['success' => true]);
    }
}

