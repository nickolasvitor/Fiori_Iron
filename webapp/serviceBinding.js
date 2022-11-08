function initModel() {
	var sUrl = "/sap/c4c/odata/v1/yserviceticket/";
	var oModel = new sap.ui.model.odata.ODataModel(sUrl, true);
	sap.ui.getCore().setModel(oModel);
}