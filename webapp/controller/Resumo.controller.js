sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/core/routing/History",
	"sap/ui/core/Fragment",
	"sap/ui/core/Popup",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"./utilities",
	"./constants",
	"../model/parcelaModel",
	"sap/m/Dialog",
	"sap/m/DialogType",
	"sap/m/Button",
	"sap/m/ButtonType",
	"sap/m/Text",
	"sap/m/MessageToast",
	"sap/m/PDFViewer"
], function (BaseController, MessageBox, History, Fragment, Popup, JSONModel, Filter, Utilities, Constants, ParcelaModel, Dialog,
	DialogType, Button,
	ButtonType, Text, MessageToast, PDFViewer) {
	"use strict";

	return BaseController.extend("com.gcb.ironhouse.app.controller.Resumo", {
		handleRouteMatched: function (oEvent) {
			var sAppId = "App5eaab451eee32a0c35fcc9dc";

			var oParams = {};

			let oContext = oEvent.getParameter("data").context;
			if (oContext) {
				this.sContext = oContext;

			} else {
				if (this.getOwnerComponent().getComponentData()) {
					var patternConvert = function (oParam) {
						if (Object.keys(oParam).length !== 0) {
							for (var prop in oParam) {
								if (prop !== "sourcePrototype" && prop.includes("Set")) {
									return prop + "(" + oParam[prop][0] + ")";
								}
							}
						}
					};

					this.sContext = patternConvert(this.getOwnerComponent().getComponentData().startupParameters);

				}
			}

			let that = this;
			this._loadUserInfoMenu();

			this._loadUnits()
				.then(this._processLoadUnitsResult.bind(this))
				.catch(this._onError.bind(this));
			this._loadOpenItems()
				.then(this._processLoadOpenItemsResult.bind(this))
				.catch(this._onError.bind(this));
			this._loadTickets()
				.then(this._processLoadTicketsResult.bind(this))
				.catch(this._onError.bind(this));

			var oPath;

			if (this.sContext) {
				oPath = {
					path: "/" + this.sContext,
					parameters: oParams
				};
				this.getView().bindObject(oPath);
			}

		},
		_loadUserInfoMenu: function () {
			// create menu only once
			if (!this._menu) {
				Fragment.load({
					name: "com.gcb.ironhouse.app.view.UserInfo",
					controller: this
				}).then(function (oMenu) {
					this._menu = oMenu;
					this.getView().addDependent(this._menu);
				}.bind(this));
			}
		},
		_loadEvents: function (oData) {

			return new Promise((fnResolve, fnReject) => {
				var oView = this.getView();
				var oModel = oView.getModel("IronHouse");
				var sPath = "/EventoSet";
				var aFilters = [];

				if (oData.results.length > 0) {

					aFilters.push(new sap.ui.model.Filter({
						path: 'Cliente',
						operator: sap.ui.model.FilterOperator.EQ,
						value1: oData.results[0].Kunnr
					}));

					for (var i = 0; i < oData.results.length; i++) {

						aFilters.push(new sap.ui.model.Filter({
							path: 'Empcd',
							operator: sap.ui.model.FilterOperator.EQ,
							value1: oData.results[i].EmpCod
						}));

					}

					oModel.read(sPath, {
						filters: aFilters,
						success: (oResult) => {
							fnResolve(oResult);
						},
						error: (oResult) => {
							fnReject(oResult);
						}
					});

				}

			});

		},

		_loadUnits: function () {

			return new Promise((fnResolve, fnReject) => {
				let oView = this.getView();
				let oModel = oView.getModel("IronHouse");
				let sPath = "/UnidadeSet";
				let aFilters = [];
				let oUserInfoModel = oView.getModel("UserInfo");
				var oCustomerModel = oView.getModel("customerModel");
				var oCliente;

				if (oUserInfoModel) {
					let oUserInfoData = oUserInfoModel.getData();

					if (oUserInfoData.UserAdm == true) {
						if (oCustomerModel) {
							var oDataCustomer = oCustomerModel.getData();
							if (oDataCustomer.Id) {
								oCliente = oDataCustomer.Id;
							}
						}
					} else {
						oCliente = oUserInfoData.Id;
					}

					if (oCliente) {
						aFilters.push(new Filter("Kunnr", sap.ui.model.FilterOperator.EQ, oCliente));

						oModel.read(sPath, {
							filters: aFilters,
							success: (oResult) => {
								fnResolve(oResult);
							},
							error: (oResult) => {
								fnReject(oResult);
							}
						});

					} else {
						fnResolve();
					}

				}

			});

		},
		_processLoadUnitsResult: function (oData) {

			if (oData.results) {
				let oJsonModel = new JSONModel({
					"unitCount": oData.results.length
				});
				this.getView().setModel(oJsonModel, "unit");

				this._loadEvents(oData)
					.then(this._processLoadEventsResult.bind(this))
					.catch(this._onError.bind(this));

			}
		},

		_processLoadEventsResult: function (oData) {

			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var oEventCount = 0;
			var aItemNotifGroup = [];
			var aGroupButtons = [];
			var aItemButtons = [];

			if (oData.results) {
				if (oData.results.length > 0) {
					oEventCount = oData.results.length;

					var cont = 1;
					var oTpEvt = Constants.cEvents.termo;

					//this._addGroupButton(aGroupButtons, oBundle.getText("textButtonAcceptAll"));
					this._addGroupButton(aItemButtons, oBundle.getText("textButtonShow"));
					//this._addGroupButton(aItemButtons, oBundle.getText("textButtonAccept"));
					//this._addGroupButton(aItemButtons, oBundle.getText("textButtonReject"));

					do {

						var aDataItemNotifGroup = {
							eventoid: cont,
							title: oTpEvt == Constants.cEvents.aviso ? oBundle.getText("textTitleEventsTermo") : oBundle.getText(
								"textTitleEventsAviso"),
							showEmptyGroup: true,
							showCloseButton: false,
							priority: "None",
							groupItems: [],
							groupButtons: oTpEvt == Constants.cEvents.termo ? aGroupButtons : []
						};

						aItemNotifGroup.push(aDataItemNotifGroup);

						oTpEvt = Constants.cEvents.aviso;
						cont = cont + 1;

					} while (cont <= 2);

					for (var i = 0; i < oData.results.length; i++) {

						if (oData.results[i].TpEvento == Constants.cEvents.termo) {
							aDataItemNotifGroup = aItemNotifGroup[1];
						} else {
							aDataItemNotifGroup = aItemNotifGroup[0];
						}

						if (oData.results[i].Status == '') {
							var oStatusDesc = '';
						} else if (oData.results[i].Status == Constants.cStatusEvent.aceito) {
							oStatusDesc = oBundle.getText("textStatusAceito");
						} else if (oData.results[i].Status == Constants.cStatusEvent.visualizado) {
							oStatusDesc = oBundle.getText("textStatusVisualizado");
						} else if (oData.results[i].Status == Constants.cStatusEvent.recusado) {
							oStatusDesc = oBundle.getText("textStatusRecusado");
						}

						var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
							pattern: "EEE, MMM d, yyyy - HH:mm:ss"
						});

						var aItem = {
							acessoPortal: oData.results[i].AcessoPortal,
							apresentarTermo: oData.results[i].ApresentarTermo,
							empcd: oData.results[i].Empcd,
							eventoid: oData.results[i].Eventoid,
							description: oData.results[i].Text,
							title: oData.results[i].Titulo,
							tpEvento: oData.results[i].TpEvento,
							unicd: oData.results[i].Unicd,
							dir: oData.results[i].Dir,
							status: oData.results[i].Status,
							dataEvento: oDateFormat.format(oData.results[i].Erdat),
							dataVisu: oData.results[i].Status != '' ? oDateFormat.format(oData.results[i].DataAceiteVisualizacao) : '',
							statusDesc: oStatusDesc,
							itemButtons: oData.results[i].Dir == '' ? [] : aItemButtons
						};

						aDataItemNotifGroup.groupItems.push(aItem);
					}
				}
			}

			var oJsonModel = new JSONModel({
				"eventCount": oEventCount,
				"itemNotifGroup": aItemNotifGroup
			});

			this.getView().setModel(oJsonModel, "events");

		},

		_addGroupButton: function (oList, oText) {

			var aItemButton = {
				text: oText
			};

			oList.push(aItemButton);

			return oList;
		},

		_onError: function (oResult) {
			const oBundle = this.getView().getModel("i18n").getResourceBundle();
			var oUserInfoModel = this.getView().getModel("UserInfo");
			var oData = oUserInfoModel.getData();
			var sMessage = oBundle.getText("errorCommunicationFailed");

			if (oData.UserAdm == true) {

				/*var oJsonResult = JSON.parse(oResult.responseText);
				var oErrorDetails = oJsonResult['error']['innererror']['errordetails'];

				for (var i = 0; i < oErrorDetails.length; i++) {
					if (oErrorDetails[i].code === "ZIH/115") {
						sMessage = oErrorDetails[i].message;
					}
				}*/

				sMessage = '';
			}

			if (sMessage) {
				MessageBox.error(sMessage);
			}

		},

		_onNavigationListItemSelect: function (oEvent) {

			var oBindingContext = oEvent.getSource().getBindingContext();

			return new Promise(function (fnResolve) {

				this.doNavigate("Resumo", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function (err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		doNavigate: function (sRouteName, fnPromiseResolve) {

			let oHash = this.oRouter.getRouteInfoByHash(this.oRouter.getHashChanger().getHash());
			var oCustomerModel = this.getView().getModel("customerModel");
			var oCliente = oHash.arguments.userId;

			if (oCustomerModel) {
				var oDataCustomer = oCustomerModel.getData();
				if (oDataCustomer.Id) {
					oCliente = oDataCustomer.Id;
				}
			}

			this.oRouter.navTo(sRouteName, {
				"userId": oCliente
			});
			fnPromiseResolve();

		},
		_onPressUnit: function (oEvent) {

			return new Promise(function (fnResolve) {
				this.doNavigate("Unidades", fnResolve);
			}.bind(this)).catch(function (err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onPressOpenItems: function (oEvent) {

			return new Promise(function (fnResolve) {

				this.doNavigate("Parcelas", fnResolve);
			}.bind(this)).catch(function (err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onPressTickets: function (oEvent) {

			return new Promise(function (fnResolve) {
				this.doNavigate("Tickets", fnResolve);
			}.bind(this)).catch(function (err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onNavButtonPress: function (oEvent) {

			let oHistory = History.getInstance();
			if (oHistory) {
				let sPreviousHash = oHistory.getPreviousHash();

				//The history contains a previous entry
				if (sPreviousHash !== undefined) {
					window.history.go(-1);
				} else {
					// There is no history!
					// replace the current hash with page 1 (will not add an history entry)
					this.getOwnerComponent().getRouter().navTo("default", null, true);
				}
			} else {
				this.getOwnerComponent().getRouter().navTo("", null, true);
			}

		},
		_onAvatarPress: function (oEvent) {
			var oButton = oEvent.getSource();
			this._loadUserInfoMenu();

			if (this._menu) {
				this._menu.open(this._bKeyboard, oButton, Popup.Dock.BeginTop, Popup.Dock.BeginBottom, oButton);
			}
		},
		_loadTickets: function () {

			return new Promise((fnResolve, fnReject) => {

				let oView = this.getView();

				let oTilet = oView.byId("tileTicketId");
				oTilet.setBusy(true);

				let oModel = oView.getModel("C4CSERVICE_SRV");
				let sPath = "/ServiceRequestCollection";

				var oCustomerModel = oView.getModel("customerModel");
				var oCliente;

				let oUserInfoModel = oView.getModel("UserInfo");
				if (oUserInfoModel) {
					let oUserInfoData = oUserInfoModel.getData();

					oCliente = oUserInfoData.Id;

					if (oCustomerModel) {
						var oDataCustomer = oCustomerModel.getData();
						if (oDataCustomer.Id) {
							oCliente = oDataCustomer.Id;
						}
					}

					let aFilters = [];
					aFilters.push(new Filter("BuyerPartyID", sap.ui.model.FilterOperator.EQ, oCliente));

					oModel.read(sPath, {
						filters: aFilters,
						success: (oResult) => {
							fnResolve(oResult);
						},
						error: (oResult) => {
							fnReject(oResult);
						}
					});
				}
			});
		},
		_processLoadTicketsResult: function (oData) {

			let oTilet = this.getView().byId("tileTicketId");
			oTilet.setBusy(false);

			if (oData.results) {
				let oJsonModel = new JSONModel({
					"ticketCount": oData.results.length
				});
				this.getView().setModel(oJsonModel, "ticket");
			}
		},
		_loadUserInfoPopUP: function (oButton) {
			// create menu only once
			Fragment.load({
				name: "com.gcb.ironhouse.app.view.UserInfoPopUp",
				controller: this
			}).then(function (oMenu) {
				this._userInfoPopUp = oMenu;
				this.getView().addDependent(this._userInfoPopUp);
				this._userInfoPopUp.open(this._bKeyboard, oButton, Popup.Dock.BeginTop, Popup.Dock.BeginBottom, oButton);
			}.bind(this));
		},
		_onSelectUserInfo: function (oEvent) {
			let oButton = oEvent.getSource();
			if (!this._userInfoPopUp) {
				this._loadUserInfoPopUP(oButton);
			} else {
				this._userInfoPopUp.open(this._bKeyboard, oButton, Popup.Dock.BeginTop, Popup.Dock.BeginBottom, oButton);
			}
		},
		_onCloseUserInfoPopUp: function (oEvent) {
			if (this._userInfoPopUp) {
				this._userInfoPopUp.close();
			}
		},
		_loadOpenItems: function () {

			return new Promise((fnResolve, fnReject) => {
				let oView = this.getView();
				let oModel = oView.getModel("IronHouse");
				let sPath = "/ParcelaSet";
				let aFilters = ParcelaModel.getOpenItemsParcelasSitFilter();
				let oUserInfoModel = oView.getModel("UserInfo");
				var oCustomerModel = oView.getModel("customerModel");
				var oCliente;

				if (oUserInfoModel) {
					let oUserInfoData = oUserInfoModel.getData();

					oCliente = oUserInfoData.Id;

					if (oCustomerModel) {
						var oDataCustomer = oCustomerModel.getData();
						if (oDataCustomer.Id) {
							oCliente = oDataCustomer.Id;
						}
					}

					aFilters.push(new Filter("Kunnr", sap.ui.model.FilterOperator.EQ, oCliente));

					oModel.read(sPath, {
						filters: aFilters,
						success: (oResult) => {
							fnResolve(oResult);
						},
						error: (oResult) => {
							fnReject(oResult);
						}
					});
				}

			});

		},
		_processLoadOpenItemsResult: function (oData) {

			if (oData.results) {
				let oJsonModel = new JSONModel({
					"openItemsCount": oData.results.length
				});
				this.getView().setModel(oJsonModel, "openItems");
			}
		},
		_onUserLogoff: function () {

			if (!this.oLogoffDialog) {
				const oBundle = this.getView().getModel("i18n").getResourceBundle();
				const sTitle = oBundle.getText("confirm");
				const sContentText = oBundle.getText("logoffQuestion");
				const sPositiveText = oBundle.getText("yes");
				const sNegativeText = oBundle.getText("no");

				this.oLogoffDialog = new Dialog({
					type: DialogType.Message,
					title: sTitle,
					content: new Text({
						text: sContentText
					}),
					beginButton: new Button({
						type: ButtonType.Emphasized,
						text: sPositiveText,
						press: function () {
							this._doLogoff();
							this.oLogoffDialog.close();
						}.bind(this)
					}),
					endButton: new Button({
						text: sNegativeText,
						press: function () {
							this.oLogoffDialog.close();
						}.bind(this)
					})
				});
			}

			this.oLogoffDialog.open();
		},
		_doLogoff: function () {
			var oCustomerView = this.getView().getModel("customerModel");
			if (oCustomerView) {
				oCustomerView.destroy();
			}

			const oBundle = this.getView().getModel("i18n").getResourceBundle();
			this.getOwnerComponent().clearLocalStorage();
			this.oRouter.navTo("Login", null, true);
			MessageToast.show(oBundle.getText("goodByeMessage"));
		},
		onInit: function () {
			Utilities.setLanguagePtBrTickets(this.getView());
			this.getOwnerComponent().readLocalStorage();
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("Resumo").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

		},
		onPressWhatsapp: function () {
			const oBundle = this.getView().getModel("i18n").getResourceBundle();
			var sURL = "https://api.whatsapp.com/send?phone=" + oBundle.getText("numberWhatsapp");
			var sText = "&text=" + oBundle.getText("messageWhatsapp");
			sURL = sURL + sText;
			window.open(sURL);
		},
		_onSelectCustomerViewInfo: function () {

			var _Fragment;
			var viewFragment = this.getView();
			var thisFragment = this;
			var timestamp = new Date().getTime();
			var fragmentID;
			const oBundle = this.getView().getModel("i18n").getResourceBundle();
			var oModel = this.getView().getModel("customerModel");

			fragmentID = "customerViewID" + viewFragment.getId() + timestamp;

			if (!_Fragment) {
				_Fragment = sap.ui.xmlfragment(fragmentID, "com.gcb.ironhouse.app.view.CustomerView", thisFragment);
				viewFragment.addDependent(_Fragment);
			}

			var sEdit = true;
			var sVisibleConfirm = false;
			var sVisibleInfor = false;
			var sButtonText = oBundle.getText("searchButton");
			var sDocument;
			var sNome;
			var sEmail;

			if (oModel) {
				var oData = oModel.getData();
				if (oData.Document) {
					var sDocument = oData.Document;
					sVisibleInfor = true;
					sEdit = false;
					sButtonText = oBundle.getText("changeButton");

					sNome = oData.Nome;
					sEmail = oData.Email;

				}
			}

			var oModelCustomer = new JSONModel({
				Document: sDocument,
				VisibleConfirm: sVisibleConfirm,
				VisibleUserInfo: sVisibleInfor,
				EditDocument: sEdit,
				TextButton: sButtonText,
				Nome: sNome,
				Email: sEmail,
				Id: ""
			});

			viewFragment.setModel(oModelCustomer, "customerModel");

			_Fragment.open();

		},
		_onChangeDocument: function (oEvent) {
			var oModel = this.getView().getModel("customerModel");
			var oData = oModel.getData();

			if (oEvent.getParameter("newValue")) {
				oData.VisibleUserInfo = false;
				oData.VisibleConfirm = false;
			}

			oModel.refresh();
		},
		_onCancelFragmentPress: function (oEvent) {
			oEvent.getSource().getParent().close();
		},
		_onCustomerConfirmPress: function (oEvent) {
			var oModel = this.getView().getModel("customerModel");
			var oData = oModel.getData();

			if (oData.Id) {
				this._loadUnits()
					.then(this._processLoadUnitsResult.bind(this))
					.catch(this._onError.bind(this));
				this._loadOpenItems()
					.then(this._processLoadOpenItemsResult.bind(this))
					.catch(this._onError.bind(this));
				this._loadTickets()
					.then(this._processLoadTicketsResult.bind(this))
					.catch(this._onError.bind(this));
			}

			oEvent.getSource().getParent().close();
		},
		_onProcessCustomer: function (oEvent) {

			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var oSource = oEvent.getSource();
			var oBindingContext = oEvent.getSource().getBindingContext();
			var that = this;
			var sButton = oSource.getProperty("text");
			var oModel = this.getView().getModel("customerModel");
			var oData = oModel.getData();

			if (sButton === oBundle.getText("searchButton")) {

				this._doLogin(oBindingContext)
					.then(that._getUserInfo.bind(that))
					.then(that._setUserInfor.bind(that));
			} else {
				oData.VisibleUserInfo = false;
				oData.VisibleConfirm = false;
				oData.EditDocument = true;
				oData.Nome = "";
				oData.Email = "";
				oData.Id = "",

					oData.TextButton = oBundle.getText("searchButton");
			}

			oModel.refresh();

		},
		_doLogin: function (oBindingContext) {

			var oModelIh = this.getView().getModel("IronHouse");
			var oModel = this.getView().getModel("customerModel");
			var oData = oModel.getData();

			var oDataLogin = {
				document: oData.Document.replace(/\D/g, ''),
				password: " ",
				adm: "X"
			};

			return new Promise((fnResolve, fnReject) => {
				oModelIh.callFunction("/Login", {
					method: "POST", // http method
					urlParameters: oDataLogin,
					success: (oData, response) => { // callback function for success
						fnResolve(oData, oBindingContext);
					},
					error: (oData) => {
						fnReject(oData);
					}
				});
			});
		},

		_getUserInfo: function (oResult) {
			var oModelIh = this.getView().getModel("IronHouse");
			return new Promise((fnResolve, fnReject) => {
				var sPath = "/UsuarioSet('" + oResult.userId + "')";
				oModelIh.read(sPath, {
					success: (oData) => fnResolve(oData),
					error: (oData) => fnReject(oData)
				});
			});
		},
		_setUserInfor: function (oResult) {

			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var oModel = this.getView().getModel("customerModel");
			var oData = oModel.getData();

			oData.VisibleUserInfo = true;
			oData.EditDocument = false;
			oData.Nome = oResult.Nome;
			oData.Email = oResult.Email;
			oData.VisibleConfirm = true;
			oData.Id = oResult.Id;

			oData.TextButton = oBundle.getText("changeButton");

			oModel.refresh();

		},

		_onNavigationEventsList: function (oEvent) {

			return new Promise(function (fnResolve) {
				var oModel = this.getView().getModel("events");

				if (oModel) {

					var oBindings = oModel.getBindings();

					if (oModel.getData().eventCount > 0) {

						for (var i = 0; i < oBindings.length; i++) {

							if (oBindings[i].getPath() === "/eventCount") {
								this.getOwnerComponent().setBindingContext(new sap.ui.model.Context(oModel.getBindings()[i], oBindings[i].getPath()));
								break;
							}
						}

						this.doNavigate("EventsList", fnResolve);

					} else {
						fnResolve();
					}
				} else {
					fnResolve();
				}
			}.bind(this)).catch(function (err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},

		_onEventsCancelPress: function (oEvent) {
			oEvent.getSource().getParent().close();
		}
	});
}, /* bExport= */ true);