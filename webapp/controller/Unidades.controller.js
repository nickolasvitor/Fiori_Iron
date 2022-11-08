sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./utilities",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/core/Fragment",
	"sap/ui/core/Popup",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Sorter"
], function (BaseController, MessageBox, Utilities, History, Filter, Fragment, Popup, JSONModel, Sorter) {
	"use strict";

	return BaseController.extend("com.gcb.ironhouse.app.controller.Unidades", {
		handleRouteMatched: function (oEvent) {
			var sAppId = "App5eaab451eee32a0c35fcc9dc";

			var oParams = {};
			let sEntitySet = "UnidadeSet";

			this._initUnitsTable(sEntitySet);
		},
		_initUnitsTable: function (sContext) {

			if (sContext) {

				let sParentPath = "IronHouse>/" + sContext;

				let oColumnListItem = new sap.m.ColumnListItem({
					type: "Navigation",
					cells: [
						/*	new sap.m.Text({
								"text": "{IronHouse>EmpreendimentoApelido}"
							}),*/
						new sap.m.Link({
							"text": "{IronHouse>EmpreendimentoApelido}",
							"href": "{IronHouse>UrlSite}",
							enabled: "{= ${IronHouse>/UrlSite} === '' ? false : true}"
						}),
						new sap.m.Text({
							"text": "{IronHouse>UnidadeApelido}"
						}),
						new sap.m.Text({
							"text": {
								"path": "IronHouse>Contrato",
								"type": "sap.ui.model.odata.type.String",
								"constraints": {
									"isDigitSequence": true,
									"maxLength": "10"
								}
							}
						}),
						new sap.m.Text({
							"text": "{IronHouse>TipoUnidadeDescr}"
						})
					]
				});

				oColumnListItem.attachPress("", this._onRowPress, this);

				let oView = this.getView();
				let oList = oView.byId("tableUnitsId");
				oList.bindItems(sParentPath, oColumnListItem);
				let oBinding = oList.getBinding("items");

				let aFilters = [];
				aFilters.push(this._getDefaultFilter());
				oBinding.filter(aFilters, sap.ui.model.FilterType.Application);
				oBinding.attachChange(this._setTitleTableCount, this);
			}
		},
		_setTitleTableCount: function () {

			let oView = this.getView();

			let oTable = oView.byId("tableUnitsId");
			let oBinding = oTable.getBinding("items");

			let oTableCount = oView.byId("labelUnitsCountId");

			let oBundle = oView.getModel("i18n").getResourceBundle();
			let sUnitsLabel = oBundle.getText("units");

			if (oTableCount) {
				let sText = sUnitsLabel + " (" + oBinding.getLength() + ")";
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
		getQueryParameters: function (oLocation) {
			var oQuery = {};
			var aParams = oLocation.search.substring(1).split("&");
			for (var i = 0; i < aParams.length; i++) {
				var aPair = aParams[i].split("=");
				oQuery[aPair[0]] = decodeURIComponent(aPair[1]);
			}
			return oQuery;

		},
		doNavigate: function (sRouteName, oBindingContext, fnPromiseResolve, sViaRelation) {
			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oModel = (oBindingContext) ? oBindingContext.getModel() : null;

			var sEntityNameSet;
			if (sPath !== null && sPath !== "") {
				if (sPath.substring(0, 1) === "/") {
					sPath = sPath.substring(1);
				}
				sEntityNameSet = sPath.split("(")[0];
			}
			var sNavigationPropertyName;
			var sMasterContext = this.sMasterContext ? this.sMasterContext : sPath;

			if (sEntityNameSet !== null) {
				sNavigationPropertyName = sViaRelation || this.getOwnerComponent().getNavigationPropertyForNavigationWithContext(sEntityNameSet,
					sRouteName);
			}
			if (sNavigationPropertyName !== null && sNavigationPropertyName !== undefined) {
				if (sNavigationPropertyName === "") {
					this.oRouter.navTo(sRouteName, {
						context: sPath,
						masterContext: sMasterContext
					}, false);
				} else {
					oModel.createBindingContext(sNavigationPropertyName, oBindingContext, null, function (bindingContext) {
						if (bindingContext) {
							sPath = bindingContext.getPath();
							if (sPath.substring(0, 1) === "/") {
								sPath = sPath.substring(1);
							}
						} else {
							sPath = "undefined";
						}

						// If the navigation is a 1-n, sPath would be "undefined" as this is not supported in Build
						if (sPath === "undefined") {
							this.oRouter.navTo(sRouteName);
						} else {
							this.oRouter.navTo(sRouteName, {
								context: sPath,
								masterContext: sMasterContext
							}, false);
						}
					}.bind(this));
				}
			} else {
				this.oRouter.navTo(sRouteName);
			}

			if (typeof fnPromiseResolve === "function") {
				fnPromiseResolve();
			}

		},
		_onRowPress: function (oEvent) {

			var oBindingContext = oEvent.getSource().getBindingContext("IronHouse");

			return new Promise(function (fnResolve) {
				let sUserId = oBindingContext.getProperty("Kunnr");
				let sUnitId = oBindingContext.getProperty("UnidadeCod");
				this.oRouter.navTo("Unidade", {
					"userId": sUserId,
					"unitId": sUnitId
				});
				fnResolve();
			}.bind(this)).catch(function (err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

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
			} else {
				this._sortDialogFragment.open(this._bKeyboard, oButton, Popup.Dock.BeginTop, Popup.Dock.BeginBottom, oButton);
			}
		},
		_prepareSortDialog: function () {

			let oView = this.getView();
			var oBundle = oView.getModel("i18n").getResourceBundle();
			let aSortTable = [];

			let oSortFieldToSort = {
				"key": "EmpreendimentoApelido",
				"text": oBundle.getText("enterprise")
			};
			aSortTable.push(oSortFieldToSort);

			oSortFieldToSort = {
				"key": "UnidadeApelido",
				"text": oBundle.getText("unit")
			};
			aSortTable.push(oSortFieldToSort);

			oSortFieldToSort = {
				"key": "TipoUnidadeDescr",
				"text": oBundle.getText("type")
			};
			aSortTable.push(oSortFieldToSort);

			let oJsonModel = new JSONModel({});
			oJsonModel.setData(aSortTable);
			oView.setModel(oJsonModel, "sorter");

		},
		_onConfirmSorter: function (oEvent) {
			let otable = this.getView().byId("tableUnitsId");
			let oBinding = otable.getBinding("items");
			let oSortItem = oEvent.getParameter("sortItem");
			let bSortDescending = oEvent.getParameter("sortDescending");
			let aSorters = [];
			let sPath = oSortItem.getKey();
			aSorters.push(new Sorter(sPath, bSortDescending));
			oBinding.sort(aSorters);
		},
		_getDefaultFilter: function () {
			let oHash = this.oRouter.getRouteInfoByHash(this.oRouter.getHashChanger().getHash());
			let ofilter = new Filter("Kunnr", sap.ui.model.FilterOperator.EQ, oHash.arguments.userId);
			return ofilter;
		},
		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.getOwnerComponent().readLocalStorage();
			this.oRouter.getTarget("Unidades").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
		}
	});
}, /* bExport= */ true);