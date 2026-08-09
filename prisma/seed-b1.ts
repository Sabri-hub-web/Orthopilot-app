import type { Patient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../server/db/client";

/** Référence démo pour RDV relatifs (C.4 filtres, démo cabinet). */
const DEMO_TODAY = new Date("2026-05-12T12:00:00.000Z");

function daysFromDemo(days: number, hour = 9, minute = 30): Date {
  const d = new Date(DEMO_TODAY);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  await prisma.internalMessage.deleteMany();
  await prisma.patientComment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.reglement.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.patient.deleteMany();

  type PatientSeed = {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    legalGuardian: string | null;
    nextAppointmentAt: Date | null;
    mutuelle: string | null;
    internalComment: string | null;
    hubStatus: "ACTIF" | "ATTENTION_ADMIN" | "ARCHIVE";
    createdAt?: Date;
  };

  const patientDefs: PatientSeed[] = [
    // —— RDV proche (< 7 j) ——
    {
      firstName: "Lucas",
      lastName: "Martin",
      email: "parent.lucas@example.com",
      phone: "06 12 45 78 90",
      legalGuardian: "Mme Martin",
      nextAppointmentAt: daysFromDemo(3, 9, 30),
      mutuelle: "Harmonie Mutuelle",
      internalComment: "Suivi normal, prochain controle prevu.",
      hubStatus: "ACTIF",
      createdAt: new Date("2026-03-01T10:00:00.000Z"),
    },
    {
      firstName: "Emma",
      lastName: "Dubois",
      email: "famille.dubois@example.com",
      phone: "06 33 22 11 44",
      legalGuardian: "M. Dubois",
      nextAppointmentAt: daysFromDemo(1, 14, 0),
      mutuelle: null,
      internalComment: "Paiement a verifier lors du prochain passage.",
      hubStatus: "ATTENTION_ADMIN",
      createdAt: new Date("2026-04-10T08:00:00.000Z"),
    },
    {
      firstName: "Adam",
      lastName: "Bernard",
      email: "adam.bernard.parent@example.com",
      phone: "06 55 44 33 22",
      legalGuardian: "Mme Bernard",
      nextAppointmentAt: daysFromDemo(5, 11, 0),
      mutuelle: "Swiss Life",
      internalComment: "Tache ouverte sur le dossier.",
      hubStatus: "ACTIF",
      createdAt: new Date("2026-02-20T14:00:00.000Z"),
    },
    {
      firstName: "Zoe",
      lastName: "Renard",
      email: "zoe.renard.parent@example.com",
      phone: "06 77 88 99 00",
      legalGuardian: "M. Renard",
      nextAppointmentAt: daysFromDemo(4, 16, 15),
      mutuelle: "MGEN",
      internalComment: "Scanner joint au dernier email.",
      hubStatus: "ACTIF",
      createdAt: new Date("2026-01-08T09:00:00.000Z"),
    },
    {
      firstName: "Tom",
      lastName: "Mercier",
      email: "tom.mercier.parent@example.com",
      phone: "06 21 21 21 21",
      legalGuardian: "Mme Mercier",
      nextAppointmentAt: daysFromDemo(2, 10, 0),
      mutuelle: null,
      internalComment: "Reglement a jour.",
      hubStatus: "ACTIF",
      createdAt: new Date("2026-04-28T11:00:00.000Z"),
    },
    // —— Sans prochain RDV ——
    {
      firstName: "Lina",
      lastName: "Caron",
      email: "lina.caron.parent@example.com",
      phone: "06 89 77 45 12",
      legalGuardian: "Mme Caron",
      nextAppointmentAt: null,
      mutuelle: null,
      internalComment: "A recontacter — pas de prochain RDV programme.",
      hubStatus: "ATTENTION_ADMIN",
      createdAt: new Date("2026-05-01T12:00:00.000Z"),
    },
    {
      firstName: "Noah",
      lastName: "Petit",
      email: "noah.petit.parent@example.com",
      phone: "06 90 12 34 56",
      legalGuardian: "M. Petit",
      nextAppointmentAt: null,
      mutuelle: null,
      internalComment: "Reglement en retard — priorite relance.",
      hubStatus: "ATTENTION_ADMIN",
      createdAt: new Date("2025-11-15T09:00:00.000Z"),
    },
    {
      firstName: "Ines",
      lastName: "Leroy",
      email: "ines.leroy.parent@example.com",
      phone: null,
      legalGuardian: "Mme Leroy",
      nextAppointmentAt: null,
      mutuelle: null,
      internalComment: "Dossier a completer (pieces manquantes).",
      hubStatus: "ACTIF",
      createdAt: new Date("2026-04-02T15:30:00.000Z"),
    },
    {
      firstName: "Camille",
      lastName: "Roux",
      email: null,
      phone: "06 44 55 66 77",
      legalGuardian: "Mme Roux",
      nextAppointmentAt: null,
      mutuelle: null,
      internalComment: "Preference contact telephone (pas d email renseigne).",
      hubStatus: "ACTIF",
      createdAt: new Date("2026-03-18T08:45:00.000Z"),
    },
    // —— Retards / montants forts ——
    {
      firstName: "Sami",
      lastName: "Benali",
      email: "sami.benali.parent@example.com",
      phone: "07 18 29 40 55",
      legalGuardian: "Mme Benali",
      nextAppointmentAt: null,
      mutuelle: null,
      internalComment: "A relancer rapidement, retard superieur a deux mois.",
      hubStatus: "ATTENTION_ADMIN",
      createdAt: new Date("2025-09-01T10:00:00.000Z"),
    },
    {
      firstName: "Chloe",
      lastName: "Moreau",
      email: "chloe.moreau.parent@example.com",
      phone: "06 11 22 33 44",
      legalGuardian: "M. Moreau",
      nextAppointmentAt: null,
      mutuelle: "April",
      internalComment: "Paiement partiel recu — solde a suivre.",
      hubStatus: "ACTIF",
      createdAt: new Date("2026-02-14T13:00:00.000Z"),
    },
    {
      firstName: "Yanis",
      lastName: "Haddad",
      email: "yanis.haddad.parent@example.com",
      phone: "07 99 88 77 66",
      legalGuardian: "Mme Haddad",
      nextAppointmentAt: null,
      mutuelle: null,
      internalComment: "Aucune preuve de paiement recente — dossier sensible.",
      hubStatus: "ATTENTION_ADMIN",
      createdAt: new Date("2025-12-05T09:30:00.000Z"),
    },
    {
      firstName: "Mehdi",
      lastName: "Kaci",
      email: "mehdi.kaci.parent@example.com",
      phone: "06 31 41 51 61",
      legalGuardian: "M. Kaci",
      nextAppointmentAt: null,
      mutuelle: null,
      internalComment: "Relances multiples sans reponse.",
      hubStatus: "ATTENTION_ADMIN",
      createdAt: new Date("2026-01-22T11:15:00.000Z"),
    },
    {
      firstName: "Theo",
      lastName: "Blanc",
      email: "theo.blanc.parent@example.com",
      phone: null,
      legalGuardian: "Mme Blanc",
      nextAppointmentAt: null,
      mutuelle: null,
      internalComment: "Telephone portable a mettre a jour.",
      hubStatus: "ACTIF",
      createdAt: new Date("2026-04-05T16:00:00.000Z"),
    },
    // —— Taches ouvertes liees ——
    {
      firstName: "Jade",
      lastName: "Robert",
      email: "jade.robert.parent@example.com",
      phone: "06 71 82 93 04",
      legalGuardian: "Mme Robert",
      nextAppointmentAt: daysFromDemo(6, 9, 0),
      mutuelle: null,
      internalComment: "Appeler parent pour reglement.",
      hubStatus: "ATTENTION_ADMIN",
      createdAt: new Date("2026-04-11T10:20:00.000Z"),
    },
    {
      firstName: "Hugo",
      lastName: "Simon",
      email: "hugo.simon.parent@example.com",
      phone: "06 52 63 74 85",
      legalGuardian: "M. Simon",
      nextAppointmentAt: daysFromDemo(6, 15, 30),
      mutuelle: "MGEN",
      internalComment: "Preparer devis mutuelle avant prochaine visite.",
      hubStatus: "ACTIF",
      createdAt: new Date("2026-03-29T14:00:00.000Z"),
    },
    {
      firstName: "Sarah",
      lastName: "Amrani",
      email: "sarah.amrani.parent@example.com",
      phone: "07 41 52 63 74",
      legalGuardian: "Mme Amrani",
      nextAppointmentAt: null,
      mutuelle: null,
      internalComment: "Verifier prochain RDV avec la famille.",
      hubStatus: "ACTIF",
      createdAt: new Date("2026-05-08T09:00:00.000Z"),
    },
    {
      firstName: "Elias",
      lastName: "Cohen",
      email: null,
      phone: "06 28 39 40 51",
      legalGuardian: "M. Cohen",
      nextAppointmentAt: null,
      mutuelle: null,
      internalComment: "Dossier suivi interne — email parent en attente.",
      hubStatus: "ACTIF",
      createdAt: new Date("2026-04-30T12:30:00.000Z"),
    },
    // —— Emails lies (urgent / doc / mutuelle) ——
    {
      firstName: "Lea",
      lastName: "Fournier",
      email: "lea.fournier.parent@example.com",
      phone: "06 21 45 90 33",
      legalGuardian: "M. Fournier",
      nextAppointmentAt: daysFromDemo(6, 11, 30),
      mutuelle: null,
      internalComment: "Email recu concernant douleur apres appareil.",
      hubStatus: "ATTENTION_ADMIN",
      createdAt: new Date("2026-05-10T08:00:00.000Z"),
    },
    {
      firstName: "Mathis",
      lastName: "Garcia",
      email: "mathis.garcia.parent@example.com",
      phone: "06 37 48 59 60",
      legalGuardian: "Mme Garcia",
      nextAppointmentAt: daysFromDemo(3, 8, 45),
      mutuelle: null,
      internalComment: "Radio envoyee par la famille par email.",
      hubStatus: "ACTIF",
      createdAt: new Date("2026-04-12T10:10:00.000Z"),
    },
    {
      firstName: "Aya",
      lastName: "Mansouri",
      email: "aya.mansouri.parent@example.com",
      phone: "07 22 33 44 55",
      legalGuardian: "Mme Mansouri",
      nextAppointmentAt: null,
      mutuelle: "Harmonie Mutuelle",
      internalComment: "Demande attestation mutuelle par email.",
      hubStatus: "ACTIF",
      createdAt: new Date("2026-03-25T09:45:00.000Z"),
    },
  ];

  const patients = await prisma.$transaction(
    patientDefs.map((p) =>
      prisma.patient.create({
        data: {
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          phone: p.phone,
          legalGuardian: p.legalGuardian,
          nextAppointmentAt: p.nextAppointmentAt,
          mutuelle: p.mutuelle,
          internalComment: p.internalComment,
          hubStatus: p.hubStatus,
          ...(p.createdAt ? { createdAt: p.createdAt } : {}),
        },
      }),
    ),
  );

  const byName = (first: string, last: string) => {
    const found = patients.find((x: Patient) => x.firstName === first && x.lastName === last);
    if (!found) throw new Error(`Patient introuvable: ${first} ${last}`);
    return found;
  };

  const [naomiPassword, juliePassword, soniaPassword, yanisPassword, noraPassword, inesPassword] = await Promise.all([
    bcrypt.hash("Naomi123!", 10),
    bcrypt.hash("Julie123!", 10),
    bcrypt.hash("Sonia123!", 10),
    bcrypt.hash("Yanis123!", 10),
    bcrypt.hash("Nora123!", 10),
    bcrypt.hash("Ines123!", 10),
  ]);

  const users = await prisma.$transaction([
    prisma.user.create({
      data: {
        fullName: "Naomi Responsable",
        email: "naomi@cabinet.local",
        role: "RESPONSABLE",
        passwordHash: naomiPassword,
      },
    }),
    prisma.user.create({
      data: {
        fullName: "Julie Secretaire",
        email: "julie@cabinet.local",
        role: "SECRETAIRE",
        passwordHash: juliePassword,
      },
    }),
    prisma.user.create({
      data: {
        fullName: "Sonia Martin",
        email: "sonia@cabinet.local",
        role: "SECRETAIRE",
        passwordHash: soniaPassword,
      },
    }),
    prisma.user.create({
      data: {
        fullName: "Yanis Dubois",
        email: "yanis@cabinet.local",
        role: "PRATICIEN",
        passwordHash: yanisPassword,
      },
    }),
    prisma.user.create({
      data: {
        fullName: "Nora Petit",
        email: "nora@cabinet.local",
        role: "ADMIN",
        passwordHash: noraPassword,
      },
    }),
    prisma.user.create({
      data: {
        fullName: "Ines Assistante",
        email: "ines@cabinet.local",
        role: "ASSISTANTE",
        passwordHash: inesPassword,
      },
    }),
  ]);

  const naomi = users[0];
  const julie = users[1];
  const sonia = users[2];

  await prisma.reglement.createMany({
    data: [
      // Vert / a jour
      {
        patientId: byName("Lucas", "Martin").id,
        amountDue: 150,
        dueDate: new Date("2026-06-01T09:00:00.000Z"),
        status: "REGLE",
        comment: "Situation reglee — suivi standard.",
      },
      {
        patientId: byName("Tom", "Mercier").id,
        amountDue: 280,
        dueDate: new Date("2026-05-30T09:00:00.000Z"),
        status: "REGLE",
        comment: "Paiement complet.",
      },
      // Orange / partiel ou attente serree
      {
        patientId: byName("Emma", "Dubois").id,
        amountDue: 180,
        dueDate: new Date("2026-05-25T09:00:00.000Z"),
        status: "PARTIEL",
        comment: "Solde partiel — relance douce au prochain RDV.",
      },
      {
        patientId: byName("Chloe", "Moreau").id,
        amountDue: 420,
        dueDate: new Date("2026-04-20T09:00:00.000Z"),
        status: "PARTIEL",
        comment: "Paiement partiel — reste 420 EUR theoriques.",
      },
      {
        patientId: byName("Zoe", "Renard").id,
        amountDue: 95,
        dueDate: new Date("2026-05-28T09:00:00.000Z"),
        status: "EN_ATTENTE",
        comment: "Echeance proche — a surveiller.",
      },
      {
        patientId: byName("Adam", "Bernard").id,
        amountDue: 300,
        dueDate: new Date("2026-06-10T09:00:00.000Z"),
        status: "EN_ATTENTE",
        comment: "Echeance future — pas d alerte immediate.",
      },
      {
        patientId: byName("Lina", "Caron").id,
        amountDue: 120,
        dueDate: new Date("2026-05-18T09:00:00.000Z"),
        status: "EN_ATTENTE",
        comment: "Rappel sans RDV — encours modere.",
      },
      {
        patientId: byName("Ines", "Leroy").id,
        amountDue: 75,
        dueDate: new Date("2026-05-30T09:00:00.000Z"),
        status: "EN_ATTENTE",
        comment: "Attente pieces dossier.",
      },
      // Rouge / retard
      {
        patientId: byName("Noah", "Petit").id,
        amountDue: 600,
        dueDate: new Date("2026-03-01T09:00:00.000Z"),
        status: "EN_RETARD",
        comment: "Retard significatif.",
      },
      {
        patientId: byName("Sami", "Benali").id,
        amountDue: 850,
        dueDate: new Date("2026-03-12T09:00:00.000Z"),
        status: "EN_RETARD",
        comment: "Retard > 2 mois — contact famille urgent.",
      },
      {
        patientId: byName("Yanis", "Haddad").id,
        amountDue: 1200,
        dueDate: new Date("2026-02-01T09:00:00.000Z"),
        status: "EN_RETARD",
        comment: "Montant eleve — aucune regularisation.",
      },
      {
        patientId: byName("Mehdi", "Kaci").id,
        amountDue: 510,
        dueDate: new Date("2026-02-28T09:00:00.000Z"),
        status: "EN_RETARD",
        comment: "Relances sans reponse.",
      },
      {
        patientId: byName("Sarah", "Amrani").id,
        amountDue: 290,
        dueDate: new Date("2026-04-01T09:00:00.000Z"),
        status: "EN_RETARD",
        comment: "Retard modere — lien avec tache suivi RDV.",
      },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        title: "Appeler parent pour reglement",
        comment: "Jade Robert — relance telephone.",
        dueDate: daysFromDemo(1, 16, 0),
        priority: "IMPORTANTE",
        status: "A_FAIRE",
        patientId: byName("Jade", "Robert").id,
        assignee: julie.fullName,
        assigneeId: julie.id,
      },
      {
        title: "Preparer devis mutuelle",
        comment: "Hugo Simon — envoyer avant prochain RDV.",
        dueDate: daysFromDemo(2, 14, 0),
        priority: "NORMALE",
        status: "EN_COURS",
        patientId: byName("Hugo", "Simon").id,
        assignee: sonia.fullName,
        assigneeId: sonia.id,
      },
      {
        title: "Verifier prochain RDV",
        comment: "Sarah Amrani — confirmer avec la famille.",
        dueDate: daysFromDemo(3, 9, 0),
        priority: "IMPORTANTE",
        status: "A_FAIRE",
        patientId: byName("Sarah", "Amrani").id,
        assignee: julie.fullName,
        assigneeId: julie.id,
      },
      {
        title: "Rappel parent — pieces dossier",
        comment: "Adam Bernard — tache liee au dossier.",
        dueDate: daysFromDemo(4, 11, 30),
        priority: "NORMALE",
        status: "A_FAIRE",
        patientId: byName("Adam", "Bernard").id,
        assignee: naomi.fullName,
        assigneeId: naomi.id,
      },
      {
        title: "Suivi administratif general",
        comment: "Tache interne sans patient lie.",
        dueDate: daysFromDemo(5, 17, 0),
        priority: "FAIBLE",
        status: "A_FAIRE",
        assignee: sonia.fullName,
        assigneeId: sonia.id,
      },
    ],
  });

  console.log(`Seed OK : ${patients.length} patients fictifs + utilisateurs cabinet.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
