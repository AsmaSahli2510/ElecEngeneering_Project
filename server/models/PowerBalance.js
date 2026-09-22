const mongoose = require("mongoose");

// Bilan de puissance d'une armoire : instantané calculé à partir des calculs de départs.
// `parameters` regroupe les coefficients configurables (Ks global, Ku par départ) ; aucune valeur normative n'est imposée.
// `basedOn` = date du calcul de départ le plus récent pris en compte : sert à détecter un bilan obsolète.
const num = { type: Number };

const powerBalanceSchema = new mongoose.Schema(
  {
    cabinetId: { type: mongoose.Schema.Types.ObjectId, ref: "Cabinet", required: true, unique: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true },
    parameters: {
      simultaneityFactor: { type: Number, required: true, min: 0, max: 1, default: 1 },
      utilizationFactors: [
        {
          _id: false,
          feederId: { type: mongoose.Schema.Types.ObjectId, ref: "Feeder", required: true },
          ku: { type: Number, required: true, min: 0, max: 1, default: 1 },
        },
      ],
    },
    result: {
      feederCount: num,
      installedPowerKw: num,
      demandPowerKw: num,
      absorbedPowerKw: num,
      apparentPowerKva: num,
      reactivePowerKvar: num,
      totalCurrent: { type: Number, required: true },
      globalPowerFactor: { type: Number, required: true },
      networkVoltage: { type: Number, required: true },
      phases: { type: String, enum: ["Triphasé", "Monophasé"], required: true },
    },
    lines: [
      {
        _id: false,
        feederId: { type: mongoose.Schema.Types.ObjectId, ref: "Feeder" },
        reference: String,
        designation: String,
        loadType: String,
        powerKw: num,
        ku: num,
        powerFactor: num,
        designCurrent: num,
        section: num,
        status: String,
      },
    ],
    status: { type: String, enum: ["validated", "attention"], required: true },
    basedOn: { type: Date, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PowerBalance", powerBalanceSchema);
