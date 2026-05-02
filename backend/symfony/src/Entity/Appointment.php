<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'appointments')]
class Appointment
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, name: 'patient_id')]
    private ?User $patient = null;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $dateTime = null;

    #[ORM\Column(length: 20)]
    private ?string $status = 'pending';

    #[ORM\Column(length: 50)]
    private ?string $type = 'general';

    public function getId(): ?int { return $this->id; }

    public function getPatient(): ?User { return $this->patient; }
    public function setPatient(?User $patient): self { $this->patient = $patient; return $this; }

    public function getDateTime(): ?\DateTimeInterface { return $this->dateTime; }
    public function setDateTime(\DateTimeInterface $dateTime): self { $this->dateTime = $dateTime; return $this; }

    public function getStatus(): ?string { return $this->status; }
    public function setStatus(string $status): self { $this->status = $status; return $this; }

    public function getType(): ?string { return $this->type; }
    public function setType(string $type): self { $this->type = $type; return $this; }
}
