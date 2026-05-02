<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'messages')]
class Message
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 128)]
    private ?string $senderId = null;

    #[ORM\Column(type: 'text')]
    private ?string $content = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $sentAt = null;

    public function getId(): ?int { return $this->id; }

    public function getSenderId(): ?string { return $this->senderId; }
    public function setSenderId(string $senderId): self { $this->senderId = $senderId; return $this; }

    public function getContent(): ?string { return $this->content; }
    public function setContent(string $content): self { $this->content = $content; return $this; }

    public function getSentAt(): ?\DateTimeImmutable { return $this->sentAt; }
    public function setSentAt(\DateTimeImmutable $sentAt): self { $this->sentAt = $sentAt; return $this; }
}
