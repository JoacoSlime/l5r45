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

  getData() {
    const baseData = super.getData();
    let sheetData = {
      owner: this.item.isOwner,
      editable: this.isEditable,
      item: baseData.item,
      data: baseData.item.system,
      config: CONFIG.l5r45
    };

    return sheetData;
  }
}