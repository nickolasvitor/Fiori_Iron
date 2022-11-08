sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/core/routing/History",
	"sap/ui/model/Sorter",
	"./constants",
	"sap/ui/core/Fragment",
	"sap/ui/core/Popup",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"./utilities"
], function (BaseController, MessageBox, History, Sorter, Constants, Fragment, Popup, JSONModel, Filter, Utilities) {
	"use strict";

	return BaseController.extend("com.gcb.ironhouse.app.controller.Unidade", {
		handleRouteMatched: function (oEvent) {
			var sAppId = "App5eaab451eee32a0c35fcc9dc";

			var oParams = {};
			let oParamData = oEvent.getParameter("data");
			let sEntityNameSet = "UnidadeSet(UnidadeCod='" + oParamData.unitId + "',Kunnr='" + oParamData.userId + "')";
			var oPath;

			if (sEntityNameSet) {
				oPath = {
					path: "/" + sEntityNameSet,
					model: "IronHouse",
					parameters: oParams
				};
				this.getView().bindObject(oPath);

				this._initTable();
			}
		},
		_initTable: function () {
			let oView = this.getView();
			let sPath = oView.getObjectBinding("IronHouse").getPath();
			let oTable = oView.byId("tableInstallmentsId");
			let oTableTemplate = this._getTableTemplate();

			sPath = "IronHouse>" + sPath + "/ParcelasUnidade";
			oTable.bindItems(sPath, oTableTemplate);
			let oBinding = oTable.getBinding("items");

			let aSorter = [];
			let bDescending = false;
			aSorter.push(new Sorter("NumParcela", bDescending));
			oBinding.sort(aSorter);

			oBinding.attachChange(this._setTitleTableCount, this);
		},

		_getTableTemplate: function () {

			let oColumnListItem = new sap.m.ColumnListItem({
				cells: [
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

					new sap.m.Text({
						"text": {
							"path": "IronHouse>Descricao"
						}
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
					new sap.m.ObjectStatus({
						"text": {
							"path": "IronHouse>PrcSitDescr"
						},
						"state": {
							"parts": [{
								"path": "IronHouse>PrcSit"
							}],
							"formatter": this._getStatePrcSit
						}
					}),
					new sap.m.Text({
						"text": {
							"path": "IronHouse>DtPgmto",
							"type": "sap.ui.model.odata.type.DateTime",
							"formatOptions": { "style": "medium" },
							"constraints": {
								"displayFormat": "Date"
							}
						}
					}),
					new sap.m.ObjectNumber({
						"number": {
							"path": "IronHouse>VlrPago",
							"type": "sap.ui.model.type.Float",
							"formatOptions": {
								"minFractionDigits": "2",
								"maxFractionDigits": "3"
							}
						},
						"unit": "{IronHouse>Waers}",
						"state": {
							"parts": [{
								"path": "IronHouse>VlrPago"
							}],
							"formatter": this._getStateVlrPago
						}
					})
				]
			});

			return oColumnListItem;
		},

		_setTitleTableCount: function () {

			let oView = this.getView();

			let oTable = oView.byId("tableInstallmentsId");
			let oBinding = oTable.getBinding("items");

			let oTableCount = oView.byId("titleTableCountId");

			let oBundle = oView.getModel("i18n").getResourceBundle();
			let sInstallmentsText = oBundle.getText("installments");

			if (oTableCount) {
				let sText = sInstallmentsText + " (" + oBinding.getLength() + ")";
				oTableCount.setText(sText);
			}
		},
		_getStateVlrPago: function (sVlrPago) {
			if (sVlrPago > 0) {
				return "Success";
			}
		},
		_getStatePrcSit: function (sPrcSit) {
			switch (sPrcSit) {
			case Constants.cPrcSit.EM_ATRASO:
				return sap.ui.core.ValueState.Error;
			case Constants.cPrcSit.PAGA:
				return sap.ui.core.ValueState.Success;
			case Constants.cPrcSit.AGUARDANDO_PAGAMENTO:
				return sap.ui.core.ValueState.Warning;
			default:
				return sap.ui.core.ValueState.None;
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
		_onRowPress: function (oEvent) {

			var oBindingContext = oEvent.getSource().getBindingContext();

			return new Promise(function (fnResolve) {

				this.doNavigate("Parcela", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function (err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

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
		_onPressGenerateBoleto: function (oEvent) {
			Utilities.generateBoleto(this, "tableInstallmentsId", MessageBox, Constants);
		},
		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.getOwnerComponent().readLocalStorage();
			this.oRouter.getTarget("Unidade").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

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
				"key": "NumParcela",
				"text": oBundle.getText("installmentNumber")
			};
			aSortTable.push(oSortFieldToSort);

			oSortFieldToSort = {
				"key": "Descricao",
				"text": oBundle.getText("installmentType")
			};
			aSortTable.push(oSortFieldToSort);

			oSortFieldToSort = {
				"key": "PrcSitDescr",
				"text": oBundle.getText("status")
			};
			aSortTable.push(oSortFieldToSort);

			oSortFieldToSort = {
				"key": "DtVenc",
				"text": oBundle.getText("dueDate")
			};
			aSortTable.push(oSortFieldToSort);

			oSortFieldToSort = {
				"key": "DtPgmto",
				"text": oBundle.getText("paymentDate")
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
					//this._prepareSortDialog();
					this._filterDialogFragment.open(this._bKeyboard, oButton, Popup.Dock.BeginTop, Popup.Dock.BeginBottom, oButton);
				}.bind(this));
			} else {
				this._filterDialogFragment.open(this._bKeyboard, oButton, Popup.Dock.BeginTop, Popup.Dock.BeginBottom, oButton);
			}
		},
		_prepareFilterFragment: function (oViewSettings) {
			let oView = this.getView();
			var oBundle = oView.getModel("i18n").getResourceBundle();

			let oViewSettingsFilterItem = new sap.m.ViewSettingsFilterItem();
			let oViewSettingsItem = new sap.m.ViewSettingsItem({
				"key": "{IronHouse>PrcSit}",
				"text": "{IronHouse>PrcSitDescr}"
			});

			oViewSettingsFilterItem.bindItems("IronHouse>/ParcelaSitSet", oViewSettingsItem);
			oViewSettingsFilterItem.setKey("PrcSit");
			oViewSettingsFilterItem.setText(oBundle.getText("status"));
			oViewSettings.addFilterItem(oViewSettingsFilterItem);

			oViewSettingsFilterItem = new sap.m.ViewSettingsFilterItem();
			oViewSettingsItem = new sap.m.ViewSettingsItem({
				"key": "{IronHouse>TpParcela}",
				"text": "{IronHouse>Descricao}"
			});

			oViewSettingsFilterItem.bindItems("IronHouse>/ParcelaTpSet", oViewSettingsItem);
			oViewSettingsFilterItem.setKey("TpParcela");
			oViewSettingsFilterItem.setText(oBundle.getText("installmentType"));
			oViewSettings.addFilterItem(oViewSettingsFilterItem);
		},
		_onConfirmFilter: function (oEvent) {
			let ofilterCompoundKeys = oEvent.getParameter("filterCompoundKeys");

			let aFilters = [];
			aFilters = Utilities.getFilterArrays(ofilterCompoundKeys);

			let oView = this.getView();
			let oTable = oView.byId("tableInstallmentsId");
			let oBinding = oTable.getBinding("items");
			oBinding.filter(aFilters, sap.ui.model.FilterType.Application);
		}
	});
}, /* bExport= */ true);