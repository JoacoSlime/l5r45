export default class l5r45Actor extends Actor {

  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);

    if (this.type === "pc") {
      // pc token settings
      this.prototypeToken.updateSource(
        {
          bar1: { "attribute": "wounds" },
          bar2: { "attribute": "suffered" },
          displayName: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
          displayBars: CONST.TOKEN_DISPLAY_MODES.OWNER,
          disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
          name: this.name,
          vision: true,
          actorLink: true,
        });
      this.updateSource({ img: "systems/l5r45/assets/icons/helm.png" });
    } else {
      // npc token settings
      this.prototypeToken.updateSource(
        {
          bar1: { "attribute": "wounds" },
          bar2: { "attribute": "suffered" },
          displayName: CONST.TOKEN_DISPLAY_MODES.OWNER,
          displayBars: CONST.TOKEN_DISPLAY_MODES.OWNER,
          disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE,
          name: this.name,
          texture: {
            "src": "systems/l5r45/assets/icons/ninja.png"
          }
        });
      this.updateSource({ img: "systems/l5r45/assets/icons/ninja.png" });
    }

  }

  prepareData() {
    super.prepareData();
  }

  prepareDerivedData() {
    const actorData = this;
    const l5r45Data = actorData.system;

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._preparePcData(actorData, l5r45Data);
    this._prepareNpcData(actorData, l5r45Data);
  }

  /**
  * Prepare Character type specific data
  */
  _preparePcData(actorData, l5r45Data) {
    if (actorData.type !== 'pc') return;

    // get skills and armors
    let skills = this.items.filter(function (item) { return item.type == "skill" });
    let armors = this.items.filter(function (item) { return item.type == "armor" });

    // calculate rings
    l5r45Data.rings.air = Math.min(l5r45Data.traits.ref, l5r45Data.traits.awa);
    l5r45Data.rings.earth = Math.min(l5r45Data.traits.sta, l5r45Data.traits.wil);
    l5r45Data.rings.fire = Math.min(l5r45Data.traits.agi, l5r45Data.traits.int);
    l5r45Data.rings.water = Math.min(l5r45Data.traits.str, l5r45Data.traits.per);

    // calculate initiative
    l5r45Data.initiative.roll = parseInt(Math.max(l5r45Data.traits.ref, l5r45Data.traits.agi)) + parseInt(l5r45Data.initiative.roll_mod);
    l5r45Data.initiative.keep = parseInt(Math.min(l5r45Data.traits.ref, l5r45Data.traits.agi)) + l5r45Data.initiative.keep_mod;

    // calculate wounds level values
    let multiplier = l5r45Data.woundsMultiplier;
    let previousLevel = 0;
    for (const [lvl, lvlData] of Object.entries(l5r45Data.wound_lvl)) {
      switch (lvl) {
        case "healthy":
          lvlData.value = parseInt(l5r45Data.traits.sta) * 5 + parseInt(l5r45Data.woundsMod);
          previousLevel = parseInt(lvlData.value);
          break;
        case "out":
          lvlData.value = parseInt(l5r45Data.traits.sta) * 3 + previousLevel + parseInt(l5r45Data.woundsMod);
          previousLevel = parseInt(lvlData.value);
          break;
        default:
          lvlData.value = parseInt(l5r45Data.traits.sta) * multiplier + previousLevel + parseInt(l5r45Data.woundsMod);
          previousLevel = parseInt(lvlData.value);
          break;
      }
    }
    // calculate heal rate
    l5r45Data.wounds.heal_rate = parseInt(l5r45Data.traits.sta);

    // calculate armor tn
    l5r45Data.armor_tn.base = parseInt((l5r45Data.traits.ref * 5)) + 5;
    l5r45Data.armor_tn.bonus = 0;

    let armorReduction = 0;
    let armorData = {};
    let armorBonus = 0;
    armors.forEach(armor => {
      armorData = armor.getRollData();
      if (armorData.equiped) {
        if (game.settings.get("l5r45", "allowArmorStacking")) {
          armorBonus += parseInt(armorData.bonus);
          armorReduction += parseInt(armorData.reduction);
        } else {
          if (parseInt(armorData.bonus) > armorBonus) {
            armorBonus = parseInt(armorData.bonus);
          }
          if (parseInt(armorData.reduction) > armorReduction) {
            armorReduction = parseInt(armorData.reduction);
          }
        }
      }
    });
    l5r45Data.armor_tn.bonus = armorBonus;
    l5r45Data.armor_tn.reduction = armorReduction;
    l5r45Data.armor_tn.current = l5r45Data.armor_tn.base + parseInt(l5r45Data.armor_tn.mod || 0) + l5r45Data.armor_tn.bonus;
    
    // calculate honor rank
    
    const honorCategories = ['comp', 'cour', 'court', 'duty', 'self', 'just', 'sinc'];
    honorCategories.forEach(category => {
      if (l5r45Data.honor[category]) {
        l5r45Data.honor[category].rank = Math.floor(l5r45Data.honor[category].points / 10);
      }
    });

    // calculate current "hp"
    l5r45Data.wounds.max = l5r45Data.wound_lvl.out.value;
    l5r45Data.wounds.value = parseInt(l5r45Data.wounds.max) - parseInt(l5r45Data.suffered);


    // calculate current would level
    let prev = { value: -1 };
    for (const [lvl, lvlData] of Object.entries(l5r45Data.wound_lvl)) {
      if (l5r45Data.suffered <= lvlData.value && l5r45Data.suffered > prev.value) {
        lvlData.current = true;
      } else {
        lvlData.current = false;
      }
      prev = lvlData
    }
    // calculate woundPenalty
    let woundLvls = Object.values(l5r45Data.wound_lvl);
    l5r45Data.currentWoundLevel = woundLvls.filter(lvl => lvl.current)[0] || this.actor.system.wound_lvl.healthy
    l5r45Data.woundPenalty = l5r45Data.currentWoundLevel.penalty

    // calculate insight points
    let insightRings = ((l5r45Data.rings.air + l5r45Data.rings.earth + l5r45Data.rings.fire + l5r45Data.rings.water + l5r45Data.rings.void.rank) * 10);
    let insighSkills = 0;
    for (const [skill, skillData] of Object.entries(skills)) {
      insighSkills += parseInt(skillData.system.rank) * ((skillData.system.type === "knowledge") ? 2 : 1);
    }
    l5r45Data.insight.points = insightRings + insighSkills;

    // calculate insight levels
    let calculateRank = game.settings.get("l5r45", "calculateRank");
    if (calculateRank) {
      l5r45Data.insight.rank = this._calculateInsightRank(l5r45Data.insight.points);
    }
    
  }

  _prepareNpcData(actorData, l5r45Data) {
    if (actorData.type !== "npc") return;

    // calculate current "hp"
    l5r45Data.wounds.value = parseInt(l5r45Data.wounds.max) - parseInt(l5r45Data.suffered);

    // calculate nr of wound lvls
    let nrWoundLvls = parseInt(l5r45Data.nrWoundLvls);

    l5r45Data.woundLvlsUsed = Object.fromEntries(
      Object.entries(l5r45Data.wound_lvl).slice(0, nrWoundLvls));

    // calculate current would level
    for (const [lvl, lvlData] of Object.entries(l5r45Data.wound_lvl)) {

      if (l5r45Data.suffered >= lvlData.value) {
        lvlData.current = true;
      } else {
        lvlData.current = false;
      }
    }
  }

  _calculateInsightRank(insight) {
    // Thresholds for the initial ranks
    const thresholds = [150, 175, 200, 225]; // Starts at 150 for rank 2
  
    // Calculate rank based on thresholds
    let rank = 1; // Default rank is 1
    for (let i = 0; i < thresholds.length; i++) {
      if (insight >= thresholds[i]) {
        rank = i + 2; // Ranks start at 2 for insight 150
      }
    }
  
    // Add additional ranks for every 25 points above 224
    if (insight >= 225) {
      rank += Math.floor((insight - 225) / 25);
    }
  
    return rank;
  }
}


