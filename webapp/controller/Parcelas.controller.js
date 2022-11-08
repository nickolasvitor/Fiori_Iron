sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/core/Fragment",
	"sap/ui/core/Popup",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Sorter",
	"./utilities",
	"../model/parcelaModel",
	"./constants"
], function (BaseController, MessageBox, History, Filter, Fragment, Popup, JSONModel, Sorter, Utilities, ParcelaModel, Constants) {
	"use strict";

	return BaseController.extend("com.gcb.ironhouse.app.controller.Parcelas", {
		handleRouteMatched: function (oEvent) {
			var sAppId = "App5eaab451eee32a0c35fcc9dc";
			
			this._initParcelasList();

		},
		_initParcelasList: function () {
			let oView = this.getView();
			
			let sPath = "IronHouse>/ParcelaSet";
			let oTemplateList = this._buildTemplateList();
			let oTable = oView.byId("tableInstallmentsId");
			
			let aFilters = ParcelaModel.getOpenItemsParcelasSitFilter();
			aFilters.push(this._getDefaultFilter());

			let aSorters = [];
			aSorters.push( new Sorter("UnidadeCod", false ));
			aSorters.push( new Sorter("NumParcela", false ));
			
			let oBindingInfo = {
				"path": sPath,
				"filters": aFilters,
				"sorter": aSorters,
				"parameters": {	 "expand" : "UnidadeParcela"				},
				template:oTemplateList
			};

			oTable.bindItems(oBindingInfo );
			let oBinding = oTable.getBinding("items");	

			oBinding.attachChange(this._setTitleTableCount, this);
		},
		_buildTemplateList: function () {
			let oColumnListItem = new sap.m.ColumnListItem({
				cells: [					
					new sap.m.Text({
						"text": {
							"path": "IronHouse>UnidadeParcela/EmpreendimentoApelido"
						}
					}),
					new sap.m.Text({
						"text": {
							"path": "IronHouse>UnidadeParcela/UnidadeApelido"
						}
					}),
					new sap.m.ObjectIdentifier({
						"title": {
							"path": "IronHouse>NumParcela",
							"type": 'sap.ui.model.odata.type.String',
							"constraints": {
								"isDigitSequence": true,
								"maxLength": "3"
							}
						}
					}),
					new sap.m.ObjectNumber({
						"number": {
							"path": "IronHouse>VlrNominal",
							"type": "sap.ui.model.type.Float",
							"formatOptions": {
								"minFractionDigits": "2",
								"maxFractionDigits": "3"
							}
						},
						"unit": "{IronHouse>Waers}"
					}),										
					new sap.m.ObjectNumber({
						"number": {
							"path": "IronHouse>VlrJuros",
							"type": "sap.ui.model.type.Float",
							"formatOptions": {
								"minFractionDigits": "2",
								"maxFractionDigits": "3"
							}
						},
						"unit": "{IronHouse>Waers}"
					}),
					new sap.m.ObjectNumber({
						"number": {
							"path": "IronHouse>VlrMulta",
							"type": "sap.ui.model.type.Float",
							"formatOptions": {
								"minFractionDigits": "2",
								"maxFractionDigits": "3"
							}
						},
						"unit": "{IronHouse>Waers}"
					}),
					new sap.m.ObjectNumber({
						"number": {
							"path": "IronHouse>VlrAPagar",
							"type": "sap.ui.model.type.Float",
							"formatOptions": {
								"minFractionDigits": "2",
								"maxFractionDigits": "3"
							}
						},
						"unit": "{IronHouse>Waers}"
					}),
					new sap.m.Text({
						"text": {
							"path": "IronHouse>DtVenc",
							"type": "sap.ui.model.odata.type.DateTime",
							"formatOptions": { "style": "medium" },
							"constraints": {
								"displayFormat": "Date"
							}
						}
					})]
			});
			return oColumnListItem;
		},
		_setTitleTableCount: function () {

			let oView = this.getView();

			let oTable = oView.byId("tableInstallmentsId");
			let oBinding = oTable.getBinding("items");

			let oTableCount = oView.byId("labelInstallmentsCountId");

			let oBundle = oView.getModel("i18n").getResourceBundle();
			let sInstallmentsText = oBundle.getText("openItems");

			if (oTableCount) {
				let sText = sInstallmentsText + " (" + oBinding.getLength() + ")";
				oTableCount.setText(sText);
			}
		},
		_onPageNavButtonPress: function () {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			var sHash = this.oRouter.getHashChanger().getHash();
			var oQueryParams = this.getQueryParameters(window.location);

			if (sPreviousHash !== undefined || oQueryParams.navBackToLaunchpad || sHash) {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("default", true);
			}

		},
		_getDefaultFilter: function () {
			let oHash = this.oRouter.getRouteInfoByHash(this.oRouter.getHashChanger().getHash());
			let ofilter = new Filter("Kunnr", sap.ui.model.FilterOperator.EQ, oHash.arguments.userId);
			return ofilter;
		},
		_onPressSort: function (oEvent) {
			var oButton = oEvent.getSource();
			if (!this._sortDialogFragment) {
				Fragment.load({
					name: "com.gcb.ironhouse.app.view.SortDialog",
					id: "sortDialog",
					controller: this
				}).then(function (oMenu) {
					this._sortDialogFragment = oMenu;
					this.getView().addDependent(this._sortDialogFragment);
					this._prepareSortDialog();
					this._sortDialogFragment.open(this._bKeyboard, oButton, Popup.Dock.BeginTop, Popup.Dock.BeginBottom, oButton);
				}.bind(this));
			}
			else {
				this._sortDialogFragment.open(this._bKeyboard, oButton, Popup.Dock.BeginTop, Popup.Dock.BeginBottom, oButton);
			}
		},
		_prepareSortDialog: function () {

			let oView = this.getView();
			var oBundle = oView.getModel("i18n").getResourceBundle();
			let aSortTable = [];
			
			let oSortFieldToSort = {
				"key": "UnidadeCod",
				"text": oBundle.getText("unit")
			};
			aSortTable.push(oSortFieldToSort);

			oSortFieldToSort = {
				"key": "NumParcela",
				"text": oBundle.getText("installmentNumber")
			};
			aSortTable.push(oSortFieldToSort);

			oSortFieldToSort = {
				"key": "DtVenc",
				"text": oBundle.getText("dueDate")
			};
			aSortTable.push(oSortFieldToSort);

			let oJsonModel = new JSONModel({});
			oJsonModel.setData(aSortTable);
			oView.setModel(oJsonModel, "sorter");

		},
		_onConfirmSorter: function (oEvent) {
			let otable = this.getView().byId("tableInstallmentsId");
			let oBinding = otable.getBinding("items");
			let oSortItem = oEvent.getParameter("sortItem");
			let bSortDescending = oEvent.getParameter("sortDescending");
			let aSorters = [];
			let sPath = oSortItem.getKey();
			aSorters.push(new Sorter(sPath, bSortDescending));
			oBinding.sort(aSorters);
		},
		_onPressGenerateBoleto: function (oEvent) {
			Utilities.generateBoleto(this, "tableInstallmentsId", MessageBox, Constants);
		},
		getQueryParameters: function(oLocation) {
			var oQuery = {};
			var aParams = oLocation.search.substring(1).split("&");
			for (var i = 0; i < aParams.length; i++) {
				var aPair = aParams[i].split("=");
				oQuery[aPair[0]] = decodeURIComponent(aPair[1]);
			}
			return oQuery;

		},
		_onPressFilter: function (oEvent) {
			var oButton = oEvent.getSource();
			if (!this._filterDialogFragment) {
				Fragment.load({
					name: "com.gcb.ironhouse.app.view.FilterDialog",
					id: "filterDialog",
					controller: this
				}).then(function (oMenu) {
					this._prepareFilterFragment(oMenu);
					this._filterDialogFragment = oMenu;
					this.getView().addDependent(this._filterDialogFragment);					
					this._filterDialogFragment.open(this._bKeyboard, oButton, Popup.Dock.BeginTop, Popup.Dock.BeginBottom, oButton);
				}.bind(this));
			} else {
				this._filterDialogFragment.open(this._bKeyboard, oButton, Popup.Dock.BeginTop, Popup.Dock.BeginBottom, oButton);
			}
		},
		_prepareFilterFragment: function(oViewSettings){
			let oView = this.getView();
			var oBundle = oView.getModel("i18n").getResourceBundle();

			let oViewSettingsFilterItem = new sap.m.ViewSettingsFilterItem();
			let oViewSettingsItem = new sap.m.ViewSettingsItem( {				
				 "key":"{IronHouse>UnidadeCod}",
				"text":"{IronHouse>UnidadeApelido}" }
			);
							
			let aFilters = [];
			aFilters.push(this._getDefaultFilter());

			let oBindingInfo = {
				"path": "IronHouse>/UnidadeSet",
				"filters": aFilters,				
				template: oViewSettingsItem
			};

			oViewSettingsFilterItem.bindItems(oBindingInfo);			
			oViewSettingsFilterItem.setKey("UnidadeCod");
			oViewSettingsFilterItem.setText(oBundle.getText("unit"));
			oViewSettings.addFilterItem(oViewSettingsFilterItem);
			
		},
		_onConfirmFilter: function(oEvent){
			
			let ofilterCompoundKeys = oEvent.getParameter("filterCompoundKeys");

			let aFilters = [];
			aFilters = Utilities.getFilterArrays(ofilterCompoundKeys);
			aFilters.push(this._getDefaultFilter());
			aFilters = aFilters.concat(ParcelaModel.getOpenItemsParcelasSitFilter());
			
			let oView = this.getView();
			let oTable = oView.byId("tableInstallmentsId");
			let oBinding = oTable.getBinding("items");
			oBinding.filter(aFilters, sap.ui.model.FilterType.Application);
		},
		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.getOwnerComponent().readLocalStorage();
			this.oRouter.getTarget("Parcelas").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
		}
	});
}, /* bExport= */ true);
