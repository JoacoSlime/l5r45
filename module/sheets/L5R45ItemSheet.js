export default class l5r45ItemSheet extends ItemSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 530,
      height: 540,
      classes: ["l5r45", "sheet", "item"]
    });
  }

  get template() {
    return `systems/l5r45/templates/sheets/${this.item.type}-sheet.hbs`;
  }


  async getData() {
    const baseData = super.getData();
    let enrichedData = baseData.item.system;
    if (typeof enrichedData.specialRules !== 'undefined') {
      enrichedData.enrichedSpecialRules = await TextEditor.enrichHTML(enrichedData.specialRules, {
        secrets: this.item.isOwner,
        relativeTo: this,
        rollData: this.object.getRollData()
      });
    }
    enrichedData.enrichedDescription = await TextEditor.enrichHTML(enrichedData.description, {
      secrets: this.item.isOwner,
      relativeTo: this,
      rollData: this.object.getRollData()
    });
    let sheetData = {
      owner: this.item.isOwner,
      editable: this.isEditable,
      item: baseData.item,
      data: enrichedData,
      config: CONFIG.l5r45
    };

    return sheetData;
  }
}