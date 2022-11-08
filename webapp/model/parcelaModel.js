sap.ui.define([
	"../controller/constants",
	"sap/ui/model/Filter"
], function (Constants, Filter) {
	"use strict";
	return {
		getOpenItemsParcelasSitFilter: function () {
			let aOpenItemsParcelas = [];
			aOpenItemsParcelas.push(new Filter("PrcSit", sap.ui.model.FilterOperator.EQ, Constants.cPrcSit.PLANEJADA));
			aOpenItemsParcelas.push(new Filter("PrcSit", sap.ui.model.FilterOperator.EQ, Constants.cPrcSit.AGUARDANDO_PAGAMENTO));
			aOpenItemsParcelas.push(new Filter("PrcSit", sap.ui.model.FilterOperator.EQ, Constants.cPrcSit.EM_ATRASO));

			return aOpenItemsParcelas;
		}
	};
});