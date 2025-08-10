/*
 * Denne fil indeholder logikken bag den interaktive doseringsberegner til børn.
 * Datastrukturen meds definere doseringsforslag for en række hyppige tilstande
 * og lægemidler. Beregningerne udføres på baggrund af barnets vægt og
 * informationerne i denne struktur.
 */

// Data for forskellige behandlinger/lægemidler.
const treatments = {
  // Smertestillende
  paracetamol: {
    // feber/smerter er den danske betegnelse, paracetamol er det latinske/navn på lægemidlet
    displayName: "Feber/smerter (paracetamol)",
    unit: "mg",
    // paracetamol doseres efter vægt pr. dosis (ca. 15 mg/kg) 4 gange dagligt. Dette svarer til 60 mg/kg/døgn og er i overensstemmelse med Panodil‑produktresuméet.
    mgPerKgPerDose: 15,
    dosesPerDay: 4,
    mgPerKgPerDay: 60,
    durationDays: "1‑3 dage",
    notes: "Børn kan få 15 mg/kg pr. dosis (typisk 60 mg/kg pr. døgn) fordelt på 4 doser med mindst 4 timer mellem doserne. Maksimalt 3 g pr. døgn."
    ,
    medication: {
      name: "Paracetamol",
      mixture: { mgPerMl: 24, packageVolumes: [100, 250] },
      tablets: { strengths: [500], breakable: [true], packageCounts: [20, 30] }
    }
  },
  ibuprofen: {
    displayName: "Feber/smerter (ibuprofen)",
    unit: "mg",
    // ibuprofen doseres 5–10 mg/kg pr. dosis hver 6.–8. time; her anvendes den øvre del (10 mg/kg).
    mgPerKgPerDose: 10,
    dosesPerDay: 3,
    mgPerKgPerDay: 30,
    durationDays: "1‑3 dage",
    notes: "Børn over 6 måneder (≥7 kg) kan få 5–10 mg/kg pr. dosis hver 6.–8. time. Maksimalt 30 mg/kg pr. døgn."
    ,
    medication: {
      name: "Ibuprofen",
      mixture: { mgPerMl: 20, packageVolumes: [100] },
      tablets: { strengths: [200], breakable: [false], packageCounts: [20, 30] }
    }
  },
  otitis: {
    displayName: "Mellemørebetændelse (akut otitis media)",
    unit: "mg",
    mgPerKgPerDay: 50,
    dosesPerDay: 3,
    durationDays: 5,
    // Noter baseret på kilden: Penicillin V 50 mg/kg/døgn i 3 doser i 5 dage.
    notes: "Førstevalg er phenoxymethylpenicillin (Penicillin V) 50 mg/kg/døgn fordelt på 3 doser i 5 dage.",
    alternative: {
      name: "Clarithromycin (ved penicillin‑allergi)",
      mgPerKgPerDay: 15,
      dosesPerDay: 2,
      durationDays: 5,
      // Noter baseret på kilden: Clarithromycin 15 mg/kg/døgn fordelt på 2 doser i 5 dage.
      notes: "Clarithromycin 15 mg/kg/døgn fordelt på 2 doser i 5 dage."
    },
    recurrence: {
      name: "Amoxicillin/clavulansyre (ved behandlingssvigt)",
      mgPerKgPerDay: 50,
      dosesPerDay: 3,
      durationDays: 7,
      // Noter baseret på kilden: Amoxicillin + clavulansyre 50/12,5 mg/kg/døgn i 3 doser i 7 dage.
      notes: "Ved behandlingssvigt eller recidiv anvendes amoxicillin + clavulansyre 50/12,5 mg/kg/døgn fordelt på 3 doser i 7 dage."
    }
    ,
    medication: {
      name: "Penicillin V",
      mixture: { mgPerMl: 50, packageVolumes: [200] },
      tablets: { strengths: [400, 800], breakable: [true, true], packageCounts: [20, 30] }
    }
  },
  strep: {
    displayName: "Streptokok halsinfektion (tonsillitis)",
    unit: "mg",
    mgPerKgPerDay: 50,
    dosesPerDay: 3,
    durationDays: 5,
    // Noter baseret på kilden: Penicillin V 50 mg/kg/døgn i 3 doser i 5 dage.
    notes: "Førstevalg er phenoxymethylpenicillin (Penicillin V) 50 mg/kg/døgn fordelt på 3 doser i 5 dage.",
    alternative: {
      name: "Clarithromycin (ved penicillin‑allergi)",
      mgPerKgPerDay: 15,
      dosesPerDay: 2,
      durationDays: 5,
      // Noter baseret på kilden: Clarithromycin 15 mg/kg/døgn i 2 doser i 5 dage.
      notes: "Clarithromycin 15 mg/kg/døgn fordelt på 2 doser i 5 dage."
    },
    recurrence: {
      name: "Amoxicillin/clavulansyre (ved recidiv)",
      mgPerKgPerDay: 50,
      dosesPerDay: 3,
      durationDays: 7,
      // Noter baseret på kilden: Ved recidiv gives penicillin V i 10 dage; alternativt amoxicillin + clavulansyre 50/12,5 mg/kg/døgn i 7 dage.
      notes: "Ved recidiv gives penicillin V i 10 dage; alternativt amoxicillin + clavulansyre 50/12,5 mg/kg/døgn i 7 dage."
    }
    ,
    medication: {
      name: "Penicillin V",
      mixture: { mgPerMl: 50, packageVolumes: [200] },
      tablets: { strengths: [400, 800], breakable: [true, true], packageCounts: [20, 30] }
    }
  },
  erythema: {
    // Der findes ikke et entydigt dansk navn; “Erythema migrans” er betegnelsen for hududslæt ved borreliose
    displayName: "Erythema migrans (borreliose)",
    unit: "mg",
    mgPerKgPerDay: 100,
    dosesPerDay: 4,
    durationDays: 10,
    // Noter baseret på kilden: Penicillin V 100 mg/kg/døgn (maks. 3 g) i 4 doser i 10 dage.
    notes: "Penicillin V 100 mg/kg/døgn (maks. 3 g) fordelt på 4 doser i 10 dage.",
    alternative: {
      name: "Doxycyclin eller Azithromycin (ved penicillin‑allergi)",
      // For børn ≥8 år: Doxycyclin 4 mg/kg/døgn i 2 doser, højst 100 mg pr. dosis
      doxy: {
        mgPerKgPerDay: 4,
        dosesPerDay: 2,
        durationDays: 10,
        // Noter baseret på kilden: Doxycyclin 4 mg/kg/døgn (maks. 100 mg pr. dosis) i 2 doser i 10 dage.
        notes: "Børn 8–12 år: Doxycyclin 4 mg/kg/døgn fordelt på 2 doser i 10 dage (maks. 100 mg pr. dosis)."
      },
      azithro: {
        mgPerKgPerDay: 10,
        dosesPerDay: 1,
        durationDays: 3,
        // Noter baseret på kilden: Azithromycin 10 mg/kg én gang dagligt i 3 dage.
        notes: "Børn &lt;8 år: Azithromycin 10 mg/kg én gang dagligt i 3 dage."
      }
    }
    ,
    medication: {
      name: "Penicillin V",
      mixture: { mgPerMl: 50, packageVolumes: [200] },
      tablets: { strengths: [400, 800], breakable: [true, true], packageCounts: [20, 30] }
    }
  },
  lactulose: {
    displayName: "Forstoppelse (laktulose)",
    unit: "ml",
    mlPerKgPerDay: 1.5, // midtpunkt i intervallet 1–2 ml/kg/dag
    dosesPerDay: 2,
    durationDays: "langvarig behandling",
    // Noter baseret på kilden: Laktulose 1–2 ml/kg/dag fordelt på 1–2 doser.
    notes: "Laktulose gives 1–2 ml/kg/dag fordelt på 1–2 doser. Doseringen kan justeres efter effekt."
    ,
    medication: {
      name: "Laktulose",
      mixture: { mgPerMl: 670, packageVolumes: [500] }
    }
  },
  macrogol: {
    displayName: "Forstoppelse (macrogol/Movicol Junior)",
    unit: "g",
    gPerKgPerDay: 0.6, // interval 0,4–0,8 g/kg/dag; her anvendes midtpunktet 0,6 g/kg/dag
    dosesPerDay: 1,
    durationDays: "langvarig behandling",
    // Noter baseret på kilden: Vedligeholdelsesbehandling med Macrogol 3350 svarer til ca. halve udtømningsdoser – ½ til 4 breve Movicol Junior dagligt afhængigt af vægt. Ét brev indeholder 6,9 g.
    notes: "Vedligeholdelsesbehandling med Macrogol 3350 svarer til ca. halve udtømningsdoser – ½ til 4 breve Movicol Junior dagligt afhængigt af vægt. Ét brev indeholder 6,9 g."
    ,
    medication: {
      name: "Macrogol",
      mixture: { mgPerMl: null, packageVolumes: [] },
      sachetSizeG: 6.9
    }
  }
  ,
  // Nye infektioner og tilstande baseret på DSAM/SST‑vejledninger
  pneumonia: {
    displayName: "Lungebetændelse (pneumoni)",
    unit: "mg",
    mgPerKgPerDay: 50,
    dosesPerDay: 3,
    // DSAM‑vejledningen for akutte nedre luftvejsinfektioner anbefaler phenoxymethylpenicillin 50 mg/kg/døgn fordelt på 3 doser i 5 dage【500917605099316†L438-L449】. Derfor anvendes en behandlingsvarighed på 5 dage.
    durationDays: 5,
    notes: "Førstevalg er phenoxymethylpenicillin (Penicillin V) 50 mg/kg/døgn fordelt på 3 doser i 5 dage. Ved behandlingssvigt kan kuren forlænges.",
    alternative: {
      name: "Clarithromycin (ved penicillinallergi) eller Amoxicillin/clavulansyre",
      mgPerKgPerDay: 15,
      dosesPerDay: 2,
      durationDays: 5,
      notes: "Clarithromycin 15 mg/kg/døgn fordelt på 2 doser i 5 dage. Ved mistanke om Haemophilus influenzae kan amoxicillin/clavulansyre 50/12,5 mg/kg/døgn fordelt på 3 doser i 5 dage anvendes."
    }
    ,
    medication: {
      name: "Penicillin V",
      mixture: { mgPerMl: 50, packageVolumes: [200] },
      tablets: { strengths: [400, 800], breakable: [true, true], packageCounts: [20, 30] }
    },
    alternativeMedication: {
      // Clarithromycin til pneumoni
      name: "Clarithromycin",
      mixture: { mgPerMl: 25, packageVolumes: [50] },
      tablets: { strengths: [250, 500], breakable: [true, true], packageCounts: [14] },
      other: {
        name: "Amoxicillin/clavulansyre",
        mixture: { mgPerMl: 50, packageVolumes: [70] },
        tablets: { strengths: [500], breakable: [true], packageCounts: [10] }
      }
    }
  },
  sinusitis: {
    // Bihulebetændelse er den danske betegnelse, akut rhinosinuitis er den latinske
    displayName: "Bihulebetændelse (akut rhinosinuitis)",
    unit: "mg",
    mgPerKgPerDay: 50,
    dosesPerDay: 3,
    durationDays: 7,
    notes: "Penicillin V 50 mg/kg/døgn fordelt på 3 doser i 7 dage.",
    alternative: {
      name: "Clarithromycin (ved penicillinallergi)",
      mgPerKgPerDay: 15,
      dosesPerDay: 2,
      durationDays: 7,
      notes: "Ved penicillinallergi kan clarithromycin 15 mg/kg/døgn fordelt på 2 doser i 7 dage anvendes. For børn ≥8 år kan doxycyclin 4 mg/kg/døgn i én daglig dosis overvejes."
    }
    ,
    medication: {
      name: "Penicillin V",
      mixture: { mgPerMl: 50, packageVolumes: [200] },
      tablets: { strengths: [400, 800], breakable: [true, true], packageCounts: [20, 30] }
    },
    alternativeMedication: {
      name: "Clarithromycin",
      mixture: { mgPerMl: 25, packageVolumes: [50] },
      tablets: { strengths: [250, 500], breakable: [true, true], packageCounts: [14] },
      other: {
        name: "Doxycyclin",
        tablets: { strengths: [100], breakable: [false], packageCounts: [10] }
      }
    }
  },
  impetigo: {
    displayName: "Hudinfektion (impetigo/inficeret sår)",
    unit: "mg",
    mgPerKgPerDay: 50,
    dosesPerDay: 3,
    durationDays: 7,
    notes: "Dicloxacillin 50 mg/kg/døgn fordelt på 3 doser i 7 dage.",
    alternative: null
    ,
    medication: {
      name: "Dicloxacillin",
      mixture: { mgPerMl: 25, packageVolumes: [100] },
      tablets: { strengths: [250, 500], breakable: [true, true], packageCounts: [20] }
    }
  },
  cystitis: {
    displayName: "Urinvejsinfektion (cystitis)",
    unit: "mg",
    mgPerKgPerDay: 20,
    dosesPerDay: 3,
    durationDays: "3–5",
    notes: "Pivmecillinam 20 mg/kg/døgn fordelt på 3 doser. Varighed 3 dage for piger og 5 dage for drenge.",
    alternative: {
      name: "Trimethoprim",
      mgPerKgPerDay: 6,
      dosesPerDay: 2,
      durationDays: "3–5",
      notes: "Trimethoprim 3 mg/kg pr. dosis (2 doser pr. døgn) i 3–5 dage."
    }
    ,
    medication: {
      name: "Pivmecillinam",
      mixture: { mgPerMl: 20, packageVolumes: [100] },
      tablets: { strengths: [200], breakable: [true], packageCounts: [20] }
    },
    alternativeMedication: {
      name: "Trimethoprim",
      mixture: { mgPerMl: 40, packageVolumes: [50] },
      tablets: { strengths: [100], breakable: [true], packageCounts: [20] }
    }
  },
  herpes: {
    displayName: "Herpesinfektion (herpes simplex)",
    unit: "mg",
    mgPerKgPerDose: 15,
    dosesPerDay: 5,
    mgPerKgPerDay: 75,
    durationDays: "5–7",
    notes: "Aciclovir 15 mg/kg pr. dosis 5 gange dagligt i 5–7 dage.",
    medication: {
      name: "Aciclovir",
      mixture: { mgPerMl: 40, packageVolumes: [100] },
      tablets: { strengths: [200], breakable: [true], packageCounts: [25] }
    }
  },
  tinea: {
    displayName: "Hovedsvamp (tinea capitis)",
    fixedDose: true,
    schedule: [
      { ageRange: "4–8 år", dose: "62,5 mg × 1" },
      { ageRange: "8–12 år", dose: "125 mg × 1" },
      { ageRange: "≥12 år", dose: "250 mg × 1" }
    ],
    durationDays: "28–42", // 4–6 uger
    notes: "Terbinafin gives som tablet én gang dagligt efter alder i 4–6 uger.",
    alternative: {
      name: "Griseofulvin (magistral)",
      notes: "Kan anvendes som alternativ behandling, men findes kun som magistral fremstilling."
    }
    ,
    medication: {
      name: "Terbinafin",
      tablets: { strengths: [62.5, 125, 250], breakable: [false, false, false], packageCounts: [14] }
    }
  },
  asthma: {
    displayName: "Astma (akut bronkospasme)",
    unit: "mg",
    mgPerKgPerDose: 0.15,
    dosesPerDay: null,
    mgPerKgPerDay: null,
    durationDays: "efter behov",
    notes: "Salbutamol inhalation 0,1–0,15 mg/kg pr. dosis. Gentages efter behov (typisk hver 4.–6. time).",
    alternative: {
      name: "Terbutalin inhalation",
      notes: "Kan anvendes som alternativ bronkodilatator; doseringen følger produktresuméet."
    }
  },
  pseudocroup: {
    displayName: "Falsk strubehoste (pseudocroup)",
    unit: "mg",
    mgPerKgPerDose: 0.15,
    dosesPerDay: 1,
    durationDays: 1,
    notes: "Dexamethason p.o. 0,15 mg/kg som engangsdosis.",
    alternative: {
      name: "Budesonid inhalation",
      notes: "Inhalationsbudesonid 2 mg kan anvendes som alternativ."
    }
  },
  anaphylaxis: {
    displayName: "Anafylaksi (anafylaksi)",
    unit: "mg",
    mgPerKgPerDose: 0.01,
    dosesPerDay: 1,
    durationDays: 1,
    notes: "Adrenalin (1 mg/ml) injiceres intramuskulært med en dosis på 0,01 mg/kg (0,1 ml/kg), maks. 0,5 mg. Dosis kan gentages ved behov.",
    alternative: null
  },
  allergic_rhinitis: {
    displayName: "Allergisk rhinitis (høfeber)",
    fixedDose: true,
    schedule: [
      { ageRange: "6 mdr–2 år", dose: "2,5 mg cetirizin × 2" },
      { ageRange: "2–6 år", dose: "5 mg cetirizin × 1–2" },
      { ageRange: "≥6 år", dose: "10 mg cetirizin × 1" }
    ],
    durationDays: "symptomperiode",
    notes: "Cetirizin gives efter alder. Doseringen kan justeres efter symptomer.",
    alternative: {
      name: "Loratadin",
      fixedDose: true,
      schedule: [
        { ageRange: "2–6 år", dose: "5 mg × 1" },
        { ageRange: "≥6 år", dose: "10 mg × 1" }
      ],
      notes: "Loratadin er et antihistamin, der kan anvendes som alternativ."
    }
  },
  reflux: {
    displayName: "Spædbarnsrefluks (gastroøsofageal refluks)",
    unit: "mg",
    mgPerKgPerDose: 1,
    dosesPerDay: 1,
    durationDays: "kortvarigt",
    notes: "Omeprazol 1 mg/kg pr. dosis én gang dagligt efter behov i kortvarige perioder.",
    alternative: null
  },
  scabies: {
    displayName: "Skab (scabies)",
    fixedDose: true,
    schedule: [ { ageRange: "Alle aldre", dose: "Permethrin creme 5 % på hele kroppen" } ],
    durationDays: "1, gentages efter 7 dage",
    notes: "Permethrin 5 % creme påføres hele kroppen (undtagen hoved på børn > 2 år); vaskes af efter 8–12 timer. Behandlingen gentages efter 7 dage.",
    alternative: {
      name: "Benzylbenzoat",
      notes: "Kan anvendes som alternativ ved behandling af scabies, men er sjældent nødvendigt."
    },
    // Tilføj mulighed for oral behandling med Scatol (ivermectin) efter vægt
    scatol: {
      name: "Scatol (ivermectin)",
      mgPerKgPerDose: 0.2,
      dosesPerDay: 1,
      repeatAfterDays: 7,
      notes: "Ivermectin 0,2 mg/kg pr. dosis gives som engangsdosis og gentages efter 7 dage. Må ikke anvendes til børn under 15 kg."
    },
    scatolMedication: {
      name: "Scatol (ivermectin)",
      tablets: { strengths: [3], breakable: [false], packageCounts: [4, 10] }
    }
  },
  lice: {
    displayName: "Lus (pediculosis)",
    fixedDose: true,
    schedule: [ { ageRange: "Alle aldre", dose: "Dimeticon lotion i håret" } ],
    durationDays: "2 behandlinger med 7 dages interval",
    notes: "Dimeticon (hårlotion) påføres tørt hår i tilstrækkelig mængde til at dække alt hår og hovedbund. Behandlingen gentages efter 7 dage.",
    alternative: {
      name: "Permethrin shampoo",
      notes: "Permethrin shampoo kan anvendes som alternativ behandling."
    }
  }
};

// Populate dropdown with treatment options
const treatmentSelect = document.getElementById("treatment-select");
// Sort keys alfabetisk efter displayName (dansk udtryk først).
const sortedKeys = Object.keys(treatments).sort((a, b) => {
  const nameA = treatments[a].displayName.toLowerCase();
  const nameB = treatments[b].displayName.toLowerCase();
  return nameA.localeCompare(nameB, 'da');
});
sortedKeys.forEach(key => {
  const option = document.createElement("option");
  option.value = key;
  option.textContent = treatments[key].displayName;
  treatmentSelect.appendChild(option);
});

const weightInput = document.getElementById("weight-input");
const resultDiv = document.getElementById("result");

function formatDose(value, unit) {
  // Round to 1 decimal if needed
  const rounded = Math.round(value * 10) / 10;
  return `${rounded} ${unit}`;
}

// Hjælpefunktion til at udtrække et heltal fra en varighedsstreng som "3–5" eller "5–7".
function parseDurationDays(duration) {
  if (typeof duration === 'string') {
    const numbers = duration.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      // returner det største tal i rækken (antager at dette dækker længste behandlingsvarighed)
      return Math.max(...numbers.map(n => parseInt(n)));
    }
  }
  return typeof duration === 'number' ? duration : null;
}

/*
 * Genererer tekst om lægemidlets administrationsform og pakninger.
 * trt.medication indeholder oplysninger om standardpræparat (navn, mixtur, tabletter osv.).
 * For nogle behandlinger findes alternative præparater i trt.alternativeMedication.
 */
function generateMedicationInfo(medObj, perDose, daily, duration, showName = true, showTablets = true) {
  let html = "";
  if (!medObj) return html;
  // Navn på lægemiddel, hvis ønsket
  if (showName) {
    html += `<p><strong>Lægemiddel:</strong> ${medObj.name}</p>`;
  }
  // Mixtur
  if (medObj.mixture && typeof medObj.mixture.mgPerMl === 'number') {
    const mgPerMl = medObj.mixture.mgPerMl;
    const mlPerDose = perDose && mgPerMl > 0 ? perDose / mgPerMl : null;
    const mlPerDay = daily && mgPerMl > 0 ? daily / mgPerMl : null;
    if (mlPerDose !== null && mlPerDay !== null) {
      html += `<p><em>Mixtur:</em> ${formatDose(mlPerDose, 'ml')} per dosis, ${formatDose(mlPerDay, 'ml')} i alt pr. døgn.</p>`;
      // Pakningsforslag
      if (typeof duration === 'number' && medObj.mixture.packageVolumes && medObj.mixture.packageVolumes.length > 0) {
        const totalVol = mlPerDay * duration;
        const sortedVols = medObj.mixture.packageVolumes.slice().sort((a,b) => a-b);
        // vælg kombination der minimerer antal pakninger
        let chosenVol = sortedVols[0];
        let packages = Math.ceil(totalVol / chosenVol);
        for (const v of sortedVols) {
          const needed = Math.ceil(totalVol / v);
          if (needed < packages) {
            chosenVol = v;
            packages = needed;
          }
        }
        html += `<p><em>Pakning (mixtur):</em> ${packages} × ${chosenVol} ml (rækker til ${duration} dage)</p>`;
      }
    }
  }
  // Tabletter
  if (showTablets && medObj.tablets && medObj.tablets.strengths && perDose && daily) {
    const strengths = medObj.tablets.strengths.slice().sort((a,b) => a-b);
    // Vælg en styrke: den største styrke der ikke overstiger perDose eller den mindste hvis alle er større
    let chosenStrength = strengths[0];
    for (const s of strengths) {
      if (s <= perDose) {
        chosenStrength = s;
      }
    }
    // beregn antal tabletter per dosis og pr. dag
    const tabletsPerDose = perDose / chosenStrength;
    const tabletsPerDay = daily / chosenStrength;
    // total antal tabletter
    const totalTablets = duration && typeof duration === 'number' ? tabletsPerDay * duration : null;
    // vælg pakningsstørrelse
    let packageSize = null;
    if (medObj.tablets.packageCounts && totalTablets !== null) {
      const sortedCounts = medObj.tablets.packageCounts.slice().sort((a,b) => a-b);
      for (const count of sortedCounts) {
        if (count >= totalTablets) {
          packageSize = count;
          break;
        }
      }
      if (!packageSize) {
        packageSize = sortedCounts[sortedCounts.length - 1];
      }
    }
    // Formatér tekst
    html += `<p><em>Tabletter:</em> ${chosenStrength} mg × ${tabletsPerDose.toFixed(2)} per dosis`;
    html += ` (${tabletsPerDay.toFixed(2)} pr. døgn)`;
    if (totalTablets !== null) {
      html += `, i alt ${Math.ceil(totalTablets)} tabletter`;
      if (packageSize) {
        const neededPackages = Math.ceil(totalTablets / packageSize);
        html += `. Pakning: ${neededPackages} × ${packageSize} stk.`;
      }
    }
    html += `</p>`;
  }
  return html;
}

// Compute dosage when input changes
function computeDose() {
  const key = treatmentSelect.value;
  const weight = parseFloat(weightInput.value);
  if (!key || isNaN(weight) || weight <= 0) {
    resultDiv.style.display = "none";
    resultDiv.innerHTML = "";
    return;
  }
  const trt = treatments[key];
  let html = `<h2>${trt.displayName}</h2>`;
  html += `<div class="dose-details">`;
  // Determine standard dose information
  // Fast doser uden beregning (fx terbinafin, antihistaminer, topikale behandlinger)
  if (trt.fixedDose) {
    // Vis skemaet med alder/dose eller én linje
    html += `<p><strong>Dosering:</strong></p>`;
    html += `<ul>`;
    trt.schedule.forEach(item => {
      html += `<li>${item.ageRange}: ${item.dose}</li>`;
    });
    html += `</ul>`;
    if (trt.durationDays) {
      html += `<p><strong>Behandlingsvarighed:</strong> ${trt.durationDays}</p>`;
    }
    html += `<p class="notes">${trt.notes}</p>`;
    // Alternative håndtering for fixed dose
    if (trt.alternative) {
      html += `<hr>`;
      html += `<p><strong>Alternativ behandling:</strong> ${trt.alternative.name}</p>`;
      if (trt.alternative.fixedDose && trt.alternative.schedule) {
        html += `<p><strong>Dosering:</strong></p><ul>`;
        trt.alternative.schedule.forEach(item => {
          html += `<li>${item.ageRange}: ${item.dose}</li>`;
        });
        html += `</ul>`;
      }
      if (trt.alternative.mgPerKgPerDay) {
        const altDaily = trt.alternative.mgPerKgPerDay * weight;
        const altPerDose = trt.alternative.dosesPerDay ? (altDaily / trt.alternative.dosesPerDay) : altDaily;
        html += `<p>${formatDose(altDaily, trt.unit)} pr. dag`;
        if (trt.alternative.dosesPerDay) {
          html += ` (${formatDose(altPerDose, trt.unit)} × ${trt.alternative.dosesPerDay})`;
        }
        if (trt.alternative.durationDays) {
          html += `, ${trt.alternative.durationDays} dage`;
        }
        html += `.</p>`;
      }
      if (trt.alternative.notes) {
        html += `<p>${trt.alternative.notes}</p>`;
      }
    }
    // Ingen recidiv/failure logik for fixed dose

    // Hvis der er angivet Scatol-behandling (ivermectin), vis den som tillægsinformation
    if (trt.scatol) {
      // dosering kun hvis vægten opfylder krav (≥15 kg)
      if (weight < 15) {
        html += `<p><strong>Oral behandling:</strong> Scatol (ivermectin) er kontraindiceret til børn under 15 kg.</p>`;
      } else {
        const scatolDose = trt.scatol.mgPerKgPerDose * weight;
        html += `<p><strong>Oral behandling (Scatol):</strong> ${formatDose(scatolDose, 'mg')} engangsdosis`;
        if (trt.scatol.repeatAfterDays) {
          html += `, gentages efter ${trt.scatol.repeatAfterDays} dage`;
        }
        html += `.</p>`;
        // Tilføj tabletinformation hvis tilgængeligt
        if (trt.scatolMedication) {
          const showTablets = weight >= 20;
          html += generateMedicationInfo(trt.scatolMedication, scatolDose, scatolDose, 1, true, showTablets);
        }
        if (trt.scatol.notes) {
          html += `<p>${trt.scatol.notes}</p>`;
        }
      }
    }
  } else if (trt.mlPerKgPerDay) {
    // Flydende medicin (ml)
    const dailyMl = trt.mlPerKgPerDay * weight;
    const perDose = trt.dosesPerDay ? dailyMl / trt.dosesPerDay : dailyMl;
    html += `<p><strong>Døgndosis:</strong> ${formatDose(dailyMl, 'ml')}</p>`;
    if (trt.dosesPerDay) {
      html += `<p><strong>Dosis per dose:</strong> ${formatDose(perDose, 'ml')} × ${trt.dosesPerDay} pr. døgn</p>`;
    }
    html += `<p><strong>Behandlingsvarighed:</strong> ${trt.durationDays}</p>`;
    html += `<p class="notes">${trt.notes}</p>`;
  } else if (trt.gPerKgPerDay) {
    // Pulver (g)
    const dailyG = trt.gPerKgPerDay * weight;
    const sachets = dailyG / 6.9;
    html += `<p><strong>Døgndosis:</strong> ${formatDose(dailyG, 'g')} (~${formatDose(sachets, 'brev(e)')})</p>`;
    html += `<p><strong>Dosis per dose:</strong> hele dagsdosis gives på én gang</p>`;
    html += `<p><strong>Behandlingsvarighed:</strong> ${trt.durationDays}</p>`;
    html += `<p class="notes">${trt.notes}</p>`;
  } else {
    // Standard mg-baseret behandling (doser/dag)
    let perDose = null;
    let daily = null;
    if (typeof trt.mgPerKgPerDose === 'number') {
      perDose = trt.mgPerKgPerDose * weight;
    }
    if (typeof trt.mgPerKgPerDay === 'number') {
      daily = trt.mgPerKgPerDay * weight;
    } else if (perDose && trt.dosesPerDay) {
      // beregn døgndosis ud fra dosis per dose og antal doser
      daily = perDose * trt.dosesPerDay;
    }
    // Hvis dosis per dose ikke er defineret, men døgndosis og antal doser er kendt, beregnes perDose
    if ((perDose === null || perDose === undefined) && daily !== null && trt.dosesPerDay) {
      perDose = daily / trt.dosesPerDay;
    }
    // Vis navnet på hovedlægemidlet først, hvis tilgængeligt
    if (trt.medication && trt.medication.name) {
      html += `<p><strong>Lægemiddel:</strong> ${trt.medication.name}</p>`;
    }
    if (daily !== null) {
      html += `<p><strong>Døgndosis:</strong> ${formatDose(daily, trt.unit)}</p>`;
    }
    if (perDose !== null) {
      html += `<p><strong>Dosis per dose:</strong> ${formatDose(perDose, trt.unit)}`;
      if (trt.dosesPerDay) {
        html += ` × ${trt.dosesPerDay} pr. døgn`;
      }
      html += `</p>`;
    }
    if (trt.durationDays) {
      html += `<p><strong>Behandlingsvarighed:</strong> ${trt.durationDays}${typeof trt.durationDays === 'number' ? ' dage' : ''}</p>`;
    }
    if (trt.notes) {
      html += `<p class="notes">${trt.notes}</p>`;
    }

    // Lægemiddel‑information baseret på præsenteret dosis (vægt, perDose/daily)
    if (perDose !== null && daily !== null) {
      // standard medicin: generer udelukkende administrationsvejledning (uden navnet som det allerede vises)
      if (trt.medication) {
        const durationForPkg = parseDurationDays(trt.durationDays);
        const showTablets = weight >= 20; // børn <20 kg (≈<6 år) anbefales kun mixtur
        html += generateMedicationInfo(trt.medication, perDose, daily, durationForPkg, false, showTablets);
      }
      // alternativ medicin med dedikeret object
      if (trt.alternativeMedication) {
        html += `<hr><p><strong>Forslag til alternativt lægemiddel:</strong></p>`;
        if (trt.alternativeMedication.name) {
          const durationForPkgAlt = parseDurationDays(trt.durationDays);
          const showTabletsAlt = weight >= 20;
          html += generateMedicationInfo(trt.alternativeMedication, perDose, daily, durationForPkgAlt, true, showTabletsAlt);
        }
        if (trt.alternativeMedication.other) {
          const durationForPkgAlt = parseDurationDays(trt.durationDays);
          const showTabletsAlt = weight >= 20;
          html += generateMedicationInfo(trt.alternativeMedication.other, perDose, daily, durationForPkgAlt, true, showTabletsAlt);
        }
      }
    }
    // Alternative behandlinger for antibiotika eller andre
    if (trt.alternative) {
      html += `<hr>`;
      html += `<p><strong>Alternativ behandling:</strong> ${trt.alternative.name}</p>`;
      // Hvis alternativet har egne mgPerKgPerDose eller mgPerKgPerDay
      let altPerDose = null;
      let altDaily = null;
      if (trt.alternative.fixedDose) {
        if (trt.alternative.schedule) {
          html += `<p><strong>Dosering:</strong></p><ul>`;
          trt.alternative.schedule.forEach(item => {
            html += `<li>${item.ageRange}: ${item.dose}</li>`;
          });
          html += `</ul>`;
        }
      } else {
        if (typeof trt.alternative.mgPerKgPerDose === 'number') {
          altPerDose = trt.alternative.mgPerKgPerDose * weight;
        }
        if (typeof trt.alternative.mgPerKgPerDay === 'number') {
          altDaily = trt.alternative.mgPerKgPerDay * weight;
        } else if (altPerDose && trt.alternative.dosesPerDay) {
          altDaily = altPerDose * trt.alternative.dosesPerDay;
        }
        if (altDaily !== null) {
          html += `<p>${formatDose(altDaily, trt.unit)} pr. døgn`;
          if (trt.alternative.dosesPerDay) {
            html += ` (${formatDose(altDaily / trt.alternative.dosesPerDay, trt.unit)} × ${trt.alternative.dosesPerDay})`;
          }
          if (trt.alternative.durationDays) {
            html += `, ${trt.alternative.durationDays} dage`;
          }
          html += `.</p>`;
        }
      }
      if (trt.alternative.notes) {
        html += `<p>${trt.alternative.notes}</p>`;
      }
    }
    // Recurrence/failure
    if (trt.recurrence) {
      html += `<hr>`;
      html += `<p><strong>Ved behandlingssvigt/recidiv:</strong> ${trt.recurrence.name}</p>`;
      const recDaily = trt.recurrence.mgPerKgPerDay * weight;
      const recPerDose = recDaily / trt.recurrence.dosesPerDay;
      html += `<p>${formatDose(recDaily, trt.unit)} pr. dag (${formatDose(recPerDose, trt.unit)} × ${trt.recurrence.dosesPerDay}), ${trt.recurrence.durationDays} dage.</p>`;
      if (trt.recurrence.notes) {
        html += `<p>${trt.recurrence.notes}</p>`;
      }
    }
  }
  html += `</div>`;
  // Copy button
  html += `<button class="copy-button" onclick="copyDose()">Kopiér dosis</button>`;
  resultDiv.innerHTML = html;
  resultDiv.style.display = "block";
}

function copyDose() {
  const temp = document.createElement('div');
  temp.innerHTML = resultDiv.innerText;
  const text = temp.innerText;
  navigator.clipboard.writeText(text).then(() => {
    alert('Dosisinformation kopieret til udklipsholderen.');
  }).catch(err => {
    console.error('Kunne ikke kopiere:', err);
  });
}

// Event listeners
treatmentSelect.addEventListener('change', computeDose);
weightInput.addEventListener('input', computeDose);