async function getTraitOrRing(skillTrait){
  switch (skillTrait) {
    case "void":
      return "l5r45.rings.void";
    case "fire":
      return "l5r45.rings.fire";
    case "water":
      return "l5r45.rings.water";
    case "earth":
      return "l5r45.rings.earth";
    case "air":
      return "l5r45.rings.air";
    default:
      return `l5r45.traits.${skillTrait}`;
  }
}

export async function SkillRoll({
  woundPenalty = 0,
  actorTrait = null,
  skillRank = null,
  skillName = null,
  skillTrait = null,
  askForOptions = true,
  npc = false,
  rollBonus = 0,
  keepBonus = 0,
  totalBonus = 0 } = {}) {
  const messageTemplate = "systems/l5r45/templates/chat/simple-roll.hbs";

  skillName = (skillName === "defense") ? game.i18n.localize("l5r45.mech.defense") : skillName;

  const traitString = skillTrait === await getTraitOrRing(skillTrait);
  let optionsSettings = game.settings.get("l5r45", "showSkillRollOptions");
  let rollType = game.i18n.localize("l5r45.mech.skillRoll");
  let label = `${rollType}: ${skillName} / ${game.i18n.localize(traitString)}`;
  let rollMod = 0;
  let keepMod = 0;
  let totalMod = 0;
  let applyWoundPenalty = true;

  if (askForOptions != optionsSettings) {
    const noVoid = npc && !game.settings.get("l5r45", "allowNpcVoidPoints");
    let checkOptions = await GetSkillOptions(skillName, noVoid, rollBonus, keepBonus, totalBonus);
    if (checkOptions.cancelled) {
      return;
    }

    applyWoundPenalty = checkOptions.applyWoundPenalty
    rollMod = parseInt(checkOptions.rollMod);
    keepMod = parseInt(checkOptions.keepMod);
    totalMod = parseInt(checkOptions.totalMod);

    if (checkOptions.void) {
      rollMod += 1;
      keepMod += 1;
      label += ` ${game.i18n.localize("l5r45.rings.void")}!`;
    }
  } else {
    rollMod = parseInt(rollBonus);
    keepMod = parseInt(keepBonus);
    totalMod = parseInt(totalBonus)
  }

  if (applyWoundPenalty) {
    totalMod = totalMod - woundPenalty;
  }

  rollMod = (skillRank >= 3) ? rollMod + 1 : rollMod;
  keepMod = (skillRank >= 5) ? keepMod + 1 : keepMod; 
  totalMod = (skillRank >= 7) ? totalMod + 5 : totalMod; 

  let diceToRoll = parseInt(actorTrait) + parseInt(skillRank) + parseInt(rollMod);
  let diceToKeep = parseInt(actorTrait) + parseInt(keepMod);
  let { diceRoll, diceKeep, bonus } = TenDiceRule(diceToRoll, diceToKeep, totalMod);
  let rollFormula = `${diceRoll}d10k${diceKeep}x10+${bonus}`;

  if (rollMod != 0 || keepMod != 0 || totalMod != 0) {
    label += ` ${game.i18n.localize("l5r45.mech.mod")} (${rollMod}k${keepMod}+${totalMod})`;
  }
  let rollResult = await new Roll(rollFormula).roll();

  let renderedRoll = await rollResult.render({
    template: messageTemplate,
    flavor: label
  });

  let messageData = {
    speaker: ChatMessage.getSpeaker(),
    content: renderedRoll
  }
  rollResult.toMessage(messageData);

}

export async function RingRoll({
  woundPenalty = 0,
  ringRank = null,
  ringName = null,
  systemRing = null,
  schoolRank = null,
  askForOptions = true,
  unskilled = false } = {}) {
  const messageTemplate = "systems/l5r45/templates/chat/simple-roll.hbs";
  let rollType = game.i18n.localize("l5r45.mech.ringRoll");
  let label = `${rollType}: ${ringName}`;
  let optionsSettings = game.settings.get("l5r45", "showSpellRollOptions");
  let affinity = false;
  let deficiency = false;
  let normalRoll = true;
  let rollMod = 0;
  let keepMod = 0;
  let totalMod = 0;
  let voidRoll = false;
  let applyWoundPenalty = true;
  let spellSlot = false;
  let voidSlot = false;

  if (unskilled) {

    label += ` ${game.i18n.localize("l5r45.mech.unskilledRoll")}`;
    let diceToRoll = parseInt(ringRank);
    let diceToKeep = parseInt(ringRank);
    let rollFormula = `${diceToRoll}d10k${diceToKeep}`;
    let rollResult = await new Roll(rollFormula).roll();
    let renderedRoll = await rollResult.render({
      template: messageTemplate,
      flavor: label
    });

    let messageData = {
      speaker: ChatMessage.getSpeaker(),
      content: renderedRoll
    }
    rollResult.toMessage(messageData);

    return false;
  }

  if (askForOptions != optionsSettings) {
    let checkOptions = await GetSpellOptions(ringName);

    if (checkOptions.cancelled) {
      return false;
    }

    applyWoundPenalty = checkOptions.applyWoundPenalty
    affinity = checkOptions.affinity;
    deficiency = checkOptions.deficiency;
    normalRoll = checkOptions.normalRoll;
    rollMod = parseInt(checkOptions.rollMod);
    keepMod = parseInt(checkOptions.keepMod);
    totalMod = parseInt(checkOptions.totalMod);
    voidRoll = checkOptions.void;
    spellSlot = checkOptions.spellSlot;
    voidSlot = checkOptions.voidSlot;

    if (voidRoll) {
      rollMod += 1;
      keepMod += 1;
      label += ` ${game.i18n.localize("l5r45.rings.void")}!`
    }
  }

  if (applyWoundPenalty) {
    totalMod = totalMod - woundPenalty;
  }

  if (normalRoll) {
    let diceToRoll = parseInt(ringRank) + parseInt(rollMod);
    let diceToKeep = parseInt(ringRank) + parseInt(keepMod);
    let { diceRoll, diceKeep, bonus } = TenDiceRule(diceToRoll, diceToKeep, totalMod);
    let rollFormula = `${diceRoll}d10k${diceKeep}x10+${bonus}`;
    let rollResult = await new Roll(rollFormula).roll();

    let renderedRoll = await rollResult.render({
      template: messageTemplate,
      flavor: label
    });

    let messageData = {
      speaker: ChatMessage.getSpeaker(),
      content: renderedRoll
    }
    rollResult.toMessage(messageData);
  } else {
    rollType = game.i18n.localize("l5r45.mech.spellCasting");
    label = `${rollType}: ${ringName}`
    if (voidRoll) {
      label += ` ${game.i18n.localize("l5r45.rings.void")}!`
    }
    if (affinity) {
      schoolRank += 1;
    }
    if (deficiency) {
      schoolRank -= 1;
    }
    if (schoolRank <= 0) {
      return ui.notifications.error(game.i18n.localize("l5r45.errors.scoolRankZero"));
    }
    let diceToRoll = parseInt(ringRank) + parseInt(schoolRank) + parseInt(rollMod);
    let diceToKeep = parseInt(ringRank) + parseInt(keepMod);
    let { diceRoll, diceKeep, bonus } = TenDiceRule(diceToRoll, diceToKeep, totalMod);
    let rollFormula = `${diceRoll}d10k${diceKeep}x10+${bonus}`;
    let rollResult = await new Roll(rollFormula).roll();

    let renderedRoll = await rollResult.render({
      template: messageTemplate,
      flavor: label
    });

    let messageData = {
      speaker: ChatMessage.getSpeaker(),
      content: renderedRoll
    }
    rollResult.toMessage(messageData);
    return { spellSlot: spellSlot, voidSlot: voidSlot, systemRing: systemRing, ringName: ringName };
  }
  return false;
}

export async function TraitRoll({
  woundPenalty = 0,
  traitRank = null,
  traitName = null,
  askForOptions = true,
  unskilled = false } = {}) {
  const messageTemplate = "systems/l5r45/templates/chat/simple-roll.hbs";
  let rollType = game.i18n.localize("l5r45.mech.traitRoll");
  let label = `${rollType}: ${traitName}`

  let optionsSettings = game.settings.get("l5r45", "showTraitRollOptions");

  let rollMod = 0;
  let keepMod = 0;
  let totalMod = 0;
  let applyWoundPenalty = true;

  if (askForOptions != optionsSettings) {
    let checkOptions = await GetTraitRollOptions(traitName);

    if (checkOptions.cancelled) {
      return;
    }

    unskilled = checkOptions.unskilled;
    applyWoundPenalty = checkOptions.applyWoundPenalty;
    rollMod = parseInt(checkOptions.rollMod);
    keepMod = parseInt(checkOptions.keepMod);
    totalMod = parseInt(checkOptions.totalMod);

    if (checkOptions.void) {
      rollMod += 1;
      keepMod += 1;
      label += ` ${game.i18n.localize("l5r45.rings.void")}!`
    }
  }
  if (applyWoundPenalty) {
    totalMod = totalMod - woundPenalty;
  }

  let diceToRoll = parseInt(traitRank) + parseInt(rollMod);
  let diceToKeep = parseInt(traitRank) + parseInt(keepMod);
  let { diceRoll, diceKeep, bonus } = TenDiceRule(diceToRoll, diceToKeep, totalMod);
  let rollFormula = `${diceRoll}d10k${diceKeep}x10+${bonus}`;
  let rollResult = await new Roll(rollFormula).roll();
  if (unskilled) {
    rollFormula = `${diceRoll}d10k${diceKeep}+${bonus}`;
    rollResult = await new Roll(rollFormula).roll();
    label += ` (${game.i18n.localize("l5r45.mech.unskilledRoll")})`
  }

  let renderedRoll = await rollResult.render({
    template: messageTemplate,
    flavor: label
  });

  let messageData = {
    speaker: ChatMessage.getSpeaker(),
    content: renderedRoll
  }

  rollResult.toMessage(messageData);
}

async function GetSkillOptions(skillName, noVoid, rollBonus = 0, keepBonus = 0, totalBonus = 0) {
  const template = "systems/l5r45/templates/chat/roll-modifiers-dialog.hbs"
  const html = await renderTemplate(template, { skill: true, noVoid, rollBonus, keepBonus, totalBonus });

  return new Promise(resolve => {
    const data = {
      title: game.i18n.format("l5r45.chat.skillRoll", { skill: skillName }),
      content: html,
      buttons: {
        normal: {
          label: game.i18n.localize("l5r45.mech.roll"),
          callback: html => resolve(_processSkillRollOptions(html[0].querySelector("form")))
        },
        cancel: {
          label: game.i18n.localize("l5r45.mech.cancel"),
          callback: () => resolve({ cancelled: true })
        }
      },
      default: "normal",
      close: () => resolve({ cancelled: true })
    };

    new Dialog(data, null).render(true);
  });
}

function _processSkillRollOptions(form) {
  return {
    applyWoundPenalty: form.woundPenalty.checked,
    rollMod: form.rollMod.value,
    keepMod: form.keepMod.value,
    totalMod: form.totalMod.value,
    void: form.void?.checked ?? false
  }
}

async function GetTraitRollOptions(traitName) {
  const template = "systems/l5r45/templates/chat/roll-modifiers-dialog.hbs"
  const html = await renderTemplate(template, { trait: true });

  return new Promise(resolve => {
    const data = {
      title: game.i18n.format("l5r45.chat.traitRoll", { trait: traitName }),
      content: html,
      buttons: {
        normal: {
          label: game.i18n.localize("l5r45.mech.roll"),
          callback: html => resolve(_processTraitRollOptions(html[0].querySelector("form")))
        },
        cancel: {
          label: game.i18n.localize("l5r45.mech.cancel"),
          callback: () => resolve({ cancelled: true })
        }
      },
      default: "normal",
      close: () => resolve({ cancelled: true })
    };

    new Dialog(data, null).render(true);
  });
}

function _processTraitRollOptions(form) {
  return {
    applyWoundPenalty: form.woundPenalty.checked,
    unskilled: form.unskilled.checked,
    rollMod: form.rollMod.value,
    keepMod: form.keepMod.value,
    totalMod: form.totalMod.value,
    void: form.void.checked
  }
}

async function GetSpellOptions(ringName) {
  const template = "systems/l5r45/templates/chat/roll-modifiers-dialog.hbs"
  const html = await renderTemplate(template, { spell: true, ring: ringName });

  return new Promise(resolve => {
    const data = {
      title: game.i18n.format("l5r45.chat.ringRoll", { ring: ringName }),
      content: html,
      buttons: {
        normalRoll: {
          label: game.i18n.localize("l5r45.mech.ringRoll"),
          callback: html => resolve(_processRingRollOptions(html[0].querySelector("form")))
        },
        cancel: {
          label: game.i18n.localize("l5r45.mech.cancel"),
          callback: () => resolve({ cancelled: true })
        }
      },
      default: "normal",
      close: () => resolve({ cancelled: true })
    };

    new Dialog(data, null).render(true);
  });
}

function _processSpellRollOptions(form) {
  return {
    applyWoundPenalty: form.woundPenalty.checked,
    affinity: form.affinity.checked,
    deficiency: form.deficiency.checked,
    rollMod: form.rollMod.value,
    keepMod: form.keepMod.value,
    totalMod: form.totalMod.value,
    void: form.void.checked,
    spellSlot: form.spellSlot.checked,
    voidSlot: form.voidSlot.checked
  }
}

function _processRingRollOptions(form) {
  return {
    applyWoundPenalty: form.woundPenalty.checked,
    rollMod: form.rollMod.value,
    keepMod: form.keepMod.value,
    totalMod: form.totalMod.value,
    void: form.void.checked,
    normalRoll: true
  }
}

export async function WeaponRoll({
  actorTrait = null,
  diceRoll = null,
  diceKeep = null,
  explodesOn = null,
  weaponName = null,
  description = null,
  askForOptions = true } = {}) {
  const messageTemplate = "systems/l5r45/templates/chat/weapon-chat.hbs";

  let optionsSettings = game.settings.get("l5r45", "showSkillRollOptions");
  let rollType = game.i18n.localize("l5r45.mech.damageRoll");
  let label = `${rollType}: ${weaponName}`

  let rollMod = 0;
  let keepMod = 0;
  let totalMod = 0;

  if (askForOptions != optionsSettings) {
    let checkOptions = await GetWeaponOptions(weaponName);

    if (checkOptions.cancelled) {
      return;
    }

    rollMod = parseInt(checkOptions.rollMod);
    keepMod = parseInt(checkOptions.keepMod);
    totalMod = parseInt(checkOptions.totalMod);

    if (checkOptions.void) {
      rollMod += 1;
      keepMod += 1;
      label += ` ${game.i18n.localize("l5r45.rings.void")}!`
    }
  }

  let diceToRoll = parseInt(actorTrait) + parseInt(diceRoll) + parseInt(rollMod);
  let diceToKeep = parseInt(diceKeep) + parseInt(keepMod);

  // Apply Ten Dice Rule
  ({diceRoll: diceToRoll, diceKeep: diceToKeep, bonus: totalMod} = TenDiceRule(diceToRoll, diceToKeep, totalMod));

  let rollFormula = `${diceToRoll}d10k${diceToKeep}x>=${explodesOn}+${totalMod}`;
  let rollResult = await new Roll(rollFormula).roll();
  let renderedRoll = await rollResult.render();

  let templateContext = {
    flavor: label,
    weapon: weaponName,
    description: description,
    roll: renderedRoll
  }

  let chatData = {
    user: game.user.id,
    speaker: ChatMessage.getSpeaker(),
    roll: rollResult,
    content: await renderTemplate(messageTemplate, templateContext),
    sound: CONFIG.sounds.dice,
    type: CONST.CHAT_MESSAGE_TYPES.ROLL
  }

  ChatMessage.create(chatData);
}

async function GetWeaponOptions(weaponName) {
  const template = "systems/l5r45/templates/chat/roll-modifiers-dialog.hbs"
  const html = await renderTemplate(template, { weapon: true });

  return new Promise(resolve => {
    const data = {
      title: game.i18n.format("l5r45.chat.damageRoll", { weapon: weaponName }),
      content: html,
      buttons: {
        normal: {
          label: game.i18n.localize("l5r45.mech.roll"),
          callback: html => resolve(_processWeaponRollOptions(html[0].querySelector("form")))
        },
        cancel: {
          label: game.i18n.localize("l5r45.mech.cancel"),
          callback: () => resolve({ cancelled: true })
        }
      },
      default: "normal",
      close: () => resolve({ cancelled: true })
    };

    new Dialog(data, null).render(true);
  });
}

function _processWeaponRollOptions(form) {
  return {
    rollMod: form.rollMod.value,
    keepMod: form.keepMod.value,
    totalMod: form.totalMod.value,
    void: form.void.checked
  }
}

export async function NpcRoll({
  woundPenalty = 0,
  diceRoll = null,
  diceKeep = null,
  rollName = null,
  description = null,
  toggleOptions = true,
  rollType = null,
  explota = true } = {}) {
  let label = `${rollName}`;
  let bonus = 0;
  let unskilled = false;
  // Make sure our numbers are numbers
  [diceRoll, diceKeep] = [diceRoll, diceKeep].map(e => parseInt(e));

  // Should we show the options dialog?
  const settingsKeys = {
    trait: "showTraitRollOptions",
    ring: "showSpellRollOptions",
    skill: "showSkillRollOptions"
  };
  let settingsKey = null;
  try {
    settingsKey = settingsKeys[rollType];
  } catch (error) {
    console.error(`Error: ${error} fetching settingsKey for rolltype: ${rollType}`);
  }

  const showOptions = game.settings.get("l5r45", settingsKey) ^ toggleOptions;
  if (showOptions) {
    const noVoid = !game.settings.get("l5r45", "allowNpcVoidPoints");
    let isTrait = rollType === "trait" ? true : false;
    let checkOptions = await getNpcRollOptions(rollName, noVoid,isTrait);

    if (checkOptions.cancelled) return;

    unskilled = checkOptions.unskilled;
    diceRoll += parseInt(checkOptions.rollMod);
    diceKeep += parseInt(checkOptions.keepMod);
    bonus += parseInt(checkOptions.totalMod);
    explota = checkOptions.explota;
    if (checkOptions.void) {
      diceRoll += 1;
      diceKeep += 1;
      label += ` ${game.i18n.localize("l5r45.rings.void")}!`
    }
    if (checkOptions.applyWoundPenalty) {
      bonus -= woundPenalty;
    }
  }

  ({ diceRoll, diceKeep, bonus } = TenDiceRule(diceRoll, diceKeep, bonus));

  const rollFormula = `${diceRoll}d10k${diceKeep}`+ (explota ? `x10` : ``) +`+${bonus}`;
  console.log("Description", description)
  if (description) {
    label += ` (${description})`
  }
  const messageData = {
    flavor: label,
    speaker: ChatMessage.getSpeaker()
  }
  if (unskilled) {
    const rollFormula = `${diceRoll}d10k${diceKeep}+${bonus}`;
    label += ` (${game.i18n.localize("l5r45.mech.unskilledRoll")})`
    const messageData = {
      flavor: label,
      speaker: ChatMessage.getSpeaker()
    }
    let rollResult = await new Roll(rollFormula).roll();
    rollResult.toMessage(messageData);

    return false;
  }
  let rollResult = await new Roll(rollFormula).roll();
  rollResult.toMessage(messageData);

  return false;
}



async function getNpcRollOptions(rollName, noVoid, trait = false, npc = true) {
  const template = "systems/l5r45/templates/chat/roll-modifiers-dialog.hbs";
  const html = await renderTemplate(template, { noVoid, npc, trait });
  return new Promise(resolve => {
    const data = {
      title: rollName,
      content: html,
      buttons: {
        normal: {
          label: game.i18n.localize("l5r45.mech.roll"),
          callback: html => resolve(_processNpcRollOptions(html[0].querySelector("form")))
        },
        cancel: {
          label: game.i18n.localize("l5r45.mech.cancel"),
          callback: () => resolve({ cancelled: true })
        }
      },
      default: "normal",
      close: () => resolve({ cancelled: true })
    };
    new Dialog(data, null).render(true);
  });
}

function _processNpcRollOptions(form) {
  return {
    applyWoundPenalty: form.woundPenalty.checked,
    explota: form.explota.checked,
    unskilled: form.unskilled ? form.unskilled.checked : false,
    rollMod: form.rollMod.value,
    keepMod: form.keepMod.value,
    totalMod: form.totalMod.value,
    void: form.void ? form.void.checked : false
  }
}

export function TenDiceRule(diceRoll, diceKeep, bonus) {
  // Check for house rule before mutating any numbers
  if (game.settings.get("l5r45", "useUnlockedDiceRules")) {
    return { diceRoll, diceKeep, bonus }
  }
  const LtHouseRule = game.settings.get("l5r45", "useLtTenDiceRule");
  const addLtBonus = LtHouseRule && diceRoll > 10 && diceRoll % 2;
  
  let extras = 0;
  if (diceRoll > 10) {
    extras = diceRoll - 10;
    diceRoll = 10;
  }

  if (diceRoll < 10) {
    if (diceKeep > 10) {
      diceKeep = 10;
    }
  } else if (diceKeep >= 10) {
    extras += diceKeep - 10;
    diceKeep = 10;
  }

  while (diceKeep < 10) {
    if (extras > 1) {
      diceKeep++;
      extras -= 2;
    } else {
      break;
    }
  }

  // LT house rule: If there's an odd number of excess rolled dice
  // and fewer than 10 kept dice, add +2 to the total
  if (addLtBonus && diceKeep < 10) {
    bonus += 2;
  }

  if (diceKeep === 10 && diceRoll === 10) {
    bonus += extras * 2;
  }
  console.log(`TENDICERULE:diceRoll: ${diceRoll}, diceKeep: ${diceKeep}, bonus: ${bonus}`)
  return { diceRoll, diceKeep, bonus }
}

export function roll_parser(roll) {
  let unskilled = false;
  if (roll.includes("u")) {
    roll = roll.replace("u", "");
    unskilled = true;
  } else if (roll.includes("e")) {
    roll = roll.replace("e", "");
  }
  let [dices, kept_explode_bonus] = roll.split`k`.map(parseIntIfPossible);
  let kept,
    explode_bonus,
    explode = 10,
    bonus = 0;
  if (kept_explode_bonus.toString().includes("x")) {
    [kept, explode_bonus = 10] = kept_explode_bonus.toString().split("x");
    [explode, bonus = 0] = explode_bonus.toString().split`+`.map((x) => +x); //Parse to int
  } else {
    [kept, bonus = 0] = kept_explode_bonus.toString().split`+`.map((x) => +x);
  }

  let roll_values = {
    dices,
    kept,
    bonus,
    rises: 0,
    explode,
    unskilled,
  };

  let result = calculate_roll(roll_values);
  console.log("Parsed roll result:", result)
  return `${result.dices}d10k${result.kept}${result.unskilled ? "" : "x>=" + result.explode
    }+${result.bonus}`;
}

function parseIntIfPossible(x) {
  const numbers = /^[0-9]+$/;
  if (x.match(numbers)) {
    return parseInt(x);
  } else {
    return x;
  }
}

function calculate_roll(roll) {
  let calculated_roll = roll;

  let { dices, rises: rises1 } = calculate_rises(roll);
  calculated_roll.dices = dices;
  calculated_roll.rises = rises1;
  let { kept, rises: rises2 } = calculate_keeps(calculated_roll);
  calculated_roll.rises = rises2;
  calculated_roll.kept = kept;
  calculated_roll.bonus = calculate_bonus(calculated_roll);
  return calculated_roll;
}

function calculate_rises({ dices, rises } = roll) {
  if (dices > 10) {
    rises = dices - 10;
    dices = 10;
  }
  return { dices, rises };
}

function calculate_keeps({ dices, kept, rises } = roll) {
  if (dices < 10) {
    if (kept > 10) {
      kept = 10;
    }
  } else if (kept >= 10) {
    rises += kept - 10;
    kept = 10;
  }

  while (kept < 10) {
    if (rises > 1) {
      kept++;
      rises -= 2;
    } else {
      break;
    }
  }

  return { kept, rises };
}

function calculate_bonus({ rises, bonus } = roll) {
  bonus += rises * 2;
  return bonus;
}