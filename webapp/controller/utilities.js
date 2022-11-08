sap.ui.define([
	"./utilities"
], function () {
	"use strict";

	// class providing static utility methods to retrieve entity default values.

	return {

		setLanguagePtBrTickets: function (oView) {
			if (oView) {
				let oModel = oView.getModel('C4CSERVICE_SRV');
				if (oModel) {
					oModel.oHeaders["Accept-Language"] = "pt";
				}
			}
		},
		generateBoleto: function (oThat, sTableId, oMessageBox, cConstants) {

			let oView = oThat.getView();
			let oModel = oView.getModel("IronHouse");
			let oTable = oView.byId(sTableId);
			let oContexts = oTable.getSelectedContexts();
			let oBundle = oView.getModel("i18n").getResourceBundle();

			for (const oContext of oContexts) {

				let sBoleto = oContext.getProperty("Boleto");
				let sPrcSit = oContext.getProperty("PrcSit");
				let bBoletoBlocked = oContext.getProperty("BoletoBlocked");

				if (sBoleto === "") {
					let sBoletoNotAvailableMsg = "";						
					if ( sPrcSit === cConstants.cPrcSit.AGUARDANDO_PAGAMENTO || 
					     sPrcSit === cConstants.cPrcSit.EM_ATRASO ){
						if ( bBoletoBlocked === true ){
							sBoletoNotAvailableMsg = oBundle.getText("errorBoletoBlocked");		
						}else{
							sBoletoNotAvailableMsg = oBundle.getText("errorBoletoNotAvalableContact");	
						}
					}else{
						sBoletoNotAvailableMsg = oBundle.getText("errorBoletoNotAvailable");
					}					
					oMessageBox.error(sBoletoNotAvailableMsg);
				} else {
					let sUrl = oModel.sServiceUrl + "/FileSet(Token='";
					sUrl = sUrl + oModel.getHeaders().Authorization + "',";
					sUrl = sUrl + "Filename='" + sBoleto + "',Filetype='01')/$value";
					sap.m.URLHelper.redirect(sUrl, true);
				}
			}
		},
		formatCnpjCpf: function (sValue) {
			const cnpjCpf = sValue.replace(/\D/g, '');

			if (cnpjCpf.length === 11) {
				return cnpjCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, "\$1.\$2.\$3-\$4");
			}

			return cnpjCpf.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g, "\$1.\$2.\$3/\$4-\$5");
		},
		getFilterArrays: function(ofilterCompoundKeys){
			let aFilters = [];
			for (const [sKey,sValue] of Object.entries(ofilterCompoundKeys)) {
				for (const [sValueKey,sValueValue] of Object.entries(sValue)) {
					if (sValueValue === true){
						aFilters.push(new sap.ui.model.Filter(sKey, sap.ui.model.FilterOperator.EQ, sValueKey));					
					}					
				}
			}
			return aFilters;
		}
	};
});
