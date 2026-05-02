<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'journals')]
class JournalEntry
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 128)]
    private ?string $userId = null;

    #[ORM\Column(type: 'text')]
    private ?string $content = null;

    #[ORM\Column(nullable: true)]
    private ?int $moodScore = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    // Getters and Setters omitted for brevity in template
}
