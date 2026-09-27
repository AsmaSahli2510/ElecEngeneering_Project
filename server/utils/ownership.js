const { Project } = require("../models");

// Identifiants des projets d'un compte : sert à filtrer toute collection qui porte un projectId
// (Cabinet, Asset, Maintenance, Ticket, ...) sans dupliquer un champ owner sur chacune d'elles.
const getOwnedProjectIds = (ownerId) => Project.find({ owner: ownerId }).distinct("_id");

module.exports = { getOwnedProjectIds };
