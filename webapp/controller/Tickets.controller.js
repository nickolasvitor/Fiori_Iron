sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./utilities",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/core/Fragment",
	"sap/ui/core/Popup",
	"sap/ui/model/Sorter",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel"
], function (BaseController, MessageBox, Utilities, History, Filter, Fragment, Popup, Sorter, MessageToast, JSONModel) {

	return BaseController.extend("com.gcb.ironhouse.app.controller.Tickets", {
		handleRouteMatched: function (oEvent) {
			var sAppId = "App5eaab451eee32a0c35fcc9dc";

			var oParams = {};
			Utilities.setLanguagePtBrTickets(this.getView());
			let oContext = oEvent.getParameter("data").context;
			if (oContext) {
				this.sContext = oContext;

			} else if (this.getOwnerComponent().getComponentData()) {
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

			var oPath;

			if (this.sContext) {
				oPath = {
					path: "/" + this.sContext,
					parameters: oParams
				};
				this.getView().bindObject(oPath);
			}

			let oJSONModel = new sap.ui.model.json.JSONModel({});
			this.getView().setModel(oJSONModel, "uploadModel");

			this._initTicketList();
			this._loadUserInfo();
			this._loadServiceIssueCategory();

		},
		_initTicketList: function () {

			let oItemTemplate = this._buildListTemplate();

			let sPath = "C4CSERVICE_SRV>/ServiceRequestCollection";

			let aFilter = [];
			let oList = this.getView().byId("listTicketsId");
			aFilter.push(this._getDefaultFilter());

			oList.bindItems(sPath, oItemTemplate);
			let oBinding = oList.getBinding("items");
			oBinding.filter(aFilter, sap.ui.model.FilterType.Application);

			let aSorter = [];
			let bDescending = true;
			aSorter.push(new Sorter("CreationDateTime", bDescending));
			oBinding.sort(aSorter);

			oBinding.attachChange(this._setTitleTableCount, this);
			oBinding.attachChange(() => {

			});
		},

		_buildListTemplate: function () {

			let oColumnListItem = new sap.m.ColumnListItem({
				type: "Navigation",
				press: this._onRowPress.bind(this),
				cells: [
					new sap.m.Text({
						"text": "{C4CSERVICE_SRV>ID}"
					}),
					new sap.m.Text({
						"text": {
							"path": "C4CSERVICE_SRV>CreationDateTime",
							"type": "sap.ui.model.type.Date",
							"formatOptions": {
								"style": "medium"
							}
						}
					}),
					new sap.m.Text({
						"text": "{C4CSERVICE_SRV>ProcessingTypeCodeText}"
					}),
					new sap.m.Text({
						"text": "{C4CSERVICE_SRV>Name}"
					}),
					new sap.m.Text({
						"text": "{C4CSERVICE_SRV>ServiceRequestLifeCycleStatusCodeText}"
					})
				]
			});

			return oColumnListItem;
		},
		_getUserId: function () {
			let oHash = this.oRouter.getRouteInfoByHash(this.oRouter.getHashChanger().getHash());
			return oHash.arguments.userId;
		},
		_getUserInfo: function () {
			let oModelUserInfo = this.getView().getModel("UserInfo");
			return oModelUserInfo.getData();
		},
		_getDefaultFilter: function () {
			let sUserId = this._getUserId();
			let ofilter = new Filter("BuyerPartyID", sap.ui.model.FilterOperator.EQ, sUserId);
			return ofilter;
		},
		_setTitleTableCount: function () {

			let oView = this.getView();

			let oTable = oView.byId("listTicketsId");
			let oBinding = oTable.getBinding("items");

			let oListCount = this.getView().byId("titleListCountId");

			let oBundle = oView.getModel("i18n").getResourceBundle();
			let sTickets = oBundle.getText("tickets");

			if (oListCount) {
				let sText = sTickets + " (" + oBinding.getLength() + ")";
				oListCount.setText(sText);
			}
		},
		_loadUserInfo: function () {
			this._readUserInfo()
				.then(this._processUserInfoResult.bind(this))
				.catch(this._processUserInfoResultError.bind(this));
		},
		_readUserInfo: function () {
			return new Promise((fnResolve, fnReject) => {

				let oModel = this.getView().getModel("C4CSERVICE_SRV");
				let sPath = "/CustomerCollection";
				let aFilters = [];
				let sUserId = this._getUserId();

				aFilters.push(new Filter("ExternalID", sap.ui.model.FilterOperator.EQ, sUserId));

				oModel.read(sPath, {
					filters: aFilters,
					success: (oResult) => {
						fnResolve(oResult);
					},
					error: (oResult) => {
						fnReject(oResult);
					}
				});
			});
		},
		_processUserInfoResult: function (oData) {
			if (oData.results) {
				if (oData.results.length > 0 && oData.results[0].UUID) {
					this.getOwnerComponent().setUserInfoUUID(oData.results[0].UUID);
				} else {
					this._showUserNotFoundMessage();
				}
			} else {
				this._showUserNotFoundMessage();
			}
		},
		_processUserInfoResultError: function (oData) {
			this._showUserNotFoundMessage();
		},
		_showUserNotFoundMessage: function () {
			const oView = this.getView();
			const oBundle = oView.getModel("i18n").getResourceBundle();
			MessageBox.error(oBundle.getText("errorUserNotFound"));
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

			const oBindingContext = oEvent.getSource().getBindingContext("C4CSERVICE_SRV");
			const oObject = oBindingContext.getObject();

			return new Promise(function (fnResolve) {
				this.oRouter.navTo("Ticket", {
					"userId": oObject["BuyerPartyID"],
					"ticketId": oObject["ObjectID"]
				});
				fnResolve();
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
		_onPressNewticket: function (oEvent) {
			var oButton = oEvent.getSource();
			if (!this._newTicketFragment) {
				Fragment.load({
					name: "com.gcb.ironhouse.app.view.NovoTicket",
					id: "newTicketFragmentIdLoad",
					controller: this
				}).then(function (oMenu) {
					this._newTicketFragment = oMenu;
					this.getView().addDependent(this._newTicketFragment);
					this._prepareNewTicketDialog();
					this._newTicketFragment.open(this._bKeyboard, oButton, Popup.Dock.BeginTop, Popup.Dock.BeginBottom, oButton);
				}.bind(this));
			} else {
				this._prepareNewTicketDialog();
				this._newTicketFragment.open(this._bKeyboard, oButton, Popup.Dock.BeginTop, Popup.Dock.BeginBottom, oButton);
			}
		},
		_createNewTicket: function (oEvent) {

			let oModel = this.getView().getModel("C4CSERVICE_SRV");
			let oNewTicketModel = this.getView().getModel("newTicket");
			let oNewTicketData = oNewTicketModel.getData();
			let aNewTicketText = [];
			let oUserInfoData = this._getUserInfo();

			if (!oUserInfoData.UUID) {
				this._showUserNotFoundMessage();
				return;
			}

			let sTicketText = oNewTicketData.unitKey + "\n\n" + oNewTicketData.ticketText;
			let oNewTicketText = {
				"Text": sTicketText,
				"TypeCode": "10007",
				"AuthorUUID": oUserInfoData.UUID
			};
			// Text Array for Deep Insert					   
			aNewTicketText.push(oNewTicketText);

			let sName = oNewTicketData.unitKey + " " + oNewTicketData.subject;
			let oDataTicket = {
				//"IncidentServiceIssueCategoryID": "CA_515",
				
				"ServiceIssueCategoryID": oNewTicketData.serviceIssueCategoryKey ,
				"Name": sName,
				"ProcessingTypeCode": "ZAIH",
				"BuyerPartyID": oUserInfoData.Id,
				"ServiceRequestText": aNewTicketText
			};

			let oFilesModel = this.getView().getModel("files");
			let oFilesData = oFilesModel.getData();
			if (oFilesData.aFiles.length > 0) {
				oDataTicket.ServiceRequestAttachmentFolder = oFilesData.aFiles;
			}

			// Deep Insert
			oModel.create("/ServiceRequestCollection", oDataTicket, {
				success: this._onCreateSuccess.bind(this),
				error: this._onCreateError.bind(this)
			});
		},
		_onCreateSuccess: function (oData, oResult) {
			const oView = this.getView();
			const oBundle = oView.getModel("i18n").getResourceBundle();
			if (oData) {
				if (oData.ID) {
					MessageToast.show(oBundle.getText("ticketCreateSuccessMsg", oData.ID));
				} else {
					MessageBox.error(oBundle.getText("errorticketCreate"));
				}
			} else {
				MessageBox.error(oBundle.getText("errorticketCreate"));
			}
		},
		_onCreateError: function (oError) {
			const oView = this.getView();
			const oBundle = oView.getModel("i18n").getResourceBundle();
			MessageBox.error(oBundle.getText("errorticketCreate"));
		},
		_prepareNewTicketDialog: function (oEvent) {

			this._resetValueStateTicketFields();
			let oComboBoxUnits = Fragment.byId("newTicketFragmentIdLoad", "comboBoxUnitId");

			let oItemsTemplate = new sap.ui.core.Item({
				"text": "{IronHouse>EmpreendimentoApelido} - {IronHouse>UnidadeApelido}",
				"key": "{IronHouse>EmpreendimentoApelido} - {IronHouse>UnidadeApelido}"
			});

			let sPath = "IronHouse>/UnidadeSet";

			let aFilter = [];
			let sUserId = this._getUserId();
			aFilter.push(new Filter("Kunnr", sap.ui.model.FilterOperator.EQ, sUserId));
			oComboBoxUnits.bindItems(sPath, oItemsTemplate);
			let oBinding = oComboBoxUnits.getBinding("items");
			oBinding.filter(aFilter);
			
			this._initServiceCategoryComboxBox();

			let oJSONModel = new sap.ui.model.json.JSONModel({
				"unitKey": "",
				"subject": "",
				"ticketText": ""
			});

			this.getView().setModel(oJSONModel, "newTicket");

			let aFileData = [];
			this._setModelFilesData(aFileData);

		},
		_onSaveNewTicket: function (oEvent) {
			if (this._isInputValid() === true ){
				this._createNewTicket();
				this._closeNewTicketDialog();
			} else {
				const oBundle = this.getView().getModel("i18n").getResourceBundle();
				MessageBox.error(oBundle.getText("errorFillMandatory"));
			}			
		},
		_isInputValid: function(){

		let oTicketText = Fragment.byId("newTicketFragmentIdLoad", "textAreaTicketTextId");
			let oInputSubject = Fragment.byId("newTicketFragmentIdLoad", "inputSubjectId");
			let oComboBoxCategory  = Fragment.byId("newTicketFragmentIdLoad", "comboBoxCategoryId");
			let oComboBoxUnits	= Fragment.byId("newTicketFragmentIdLoad", "comboBoxUnitId");

			let bValid = true;

			if (oTicketText.getValue() !== "" ) {
				oTicketText.setValueState(sap.ui.core.ValueState.None);
			} else {
				bValid = false;
				oTicketText.setValueState(sap.ui.core.ValueState.Error);				
			}

			if (oInputSubject.getValue() !== "" ) {
				oInputSubject.setValueState(sap.ui.core.ValueState.None);
			} else {
				bValid = false;
				oInputSubject.setValueState(sap.ui.core.ValueState.Error);				
			}

			if (oComboBoxCategory.getSelectedKey() !== ""){
				oComboBoxCategory.setValueState(sap.ui.core.ValueState.None);
			} else {
				bValid = false;
				oComboBoxCategory.setValueState(sap.ui.core.ValueState.Error);				
			}

			if (oComboBoxUnits.getSelectedKey() !== ""){
				oComboBoxUnits.setValueState(sap.ui.core.ValueState.None);
			} else {
				bValid = false;
				oComboBoxUnits.setValueState(sap.ui.core.ValueState.Error);				
			}

			return bValid;
		},
		_onCancelNewTicket: function (oEvent) {
			this._closeNewTicketDialog();
		},
		_closeNewTicketDialog: function (oEvent) {
			if (this._newTicketFragment) {
				this._newTicketFragment.close();
			}
			this._destroyUploadCollectionFiles();
		},
		_destroyUploadCollectionFiles: function () {
			let oUploadCollection = Fragment.byId("newTicketFragmentIdLoad", "uploadCollectionId");
			if (oUploadCollection) {

				oUploadCollection.removeAllItems();

				let aFileData = [];
				this._setModelFilesData(aFileData);
			}
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
				"key": "ID",
				"text": oBundle.getText("idTicket")
			};
			aSortTable.push(oSortFieldToSort);

			oSortFieldToSort = {
				"key": "CreationDateTime",
				"text": oBundle.getText("date")
			};
			aSortTable.push(oSortFieldToSort);

			oSortFieldToSort = {
				"key": "ServiceRequestLifeCycleStatusCodeText",
				"text": oBundle.getText("status")
			};
			aSortTable.push(oSortFieldToSort);

			let oJsonModel = new JSONModel({});
			oJsonModel.setData(aSortTable);
			oView.setModel(oJsonModel, "sorter");

		},
		_onConfirmSorter: function (oEvent) {
			let otable = this.getView().byId("listTicketsId");
			let oBinding = otable.getBinding("items");
			let oSortItem = oEvent.getParameter("sortItem");
			let bSortDescending = oEvent.getParameter("sortDescending");
			let aSorters = [];
			let sPath = oSortItem.getKey();
			aSorters.push(new Sorter(sPath, bSortDescending));
			oBinding.sort(aSorters);
		},
		_onChange: function (oEvent) {
			//var oUploadCollection = Fragment.byId("newTicketFragmentIdLoad", "UploadCollection");

			var reader = new FileReader();
			//for (const oFile of oUploadCollection.getItems()) {

			let oItem = oEvent.getParameter("item");
			let oFile = oEvent.getParameter("files")[0];
			//let oFile = oEvent.getParameter("item").getFileObject();
			reader.onload = function (e) {
				let aFileData = this.getView().getModel("files").getData();

				let vBase64 = e.currentTarget.result.replace("data:" + oFile.type + ";base64,", "");
				let oNewFile = {
					"Binary": vBase64,
					"Name": oFile.name,
					"MimeType": oFile.type,
					"TypeCode": "10001",
					"CategoryCode": "2"
				};

				aFileData.aFiles.push(oNewFile);
				this._setModelFilesData(aFileData.aFiles);
				
				// Hide Delete button. For some bug default propertie do not work
				let oUploadCollection = Fragment.byId("newTicketFragmentIdLoad", "uploadCollectionId");
				if (oUploadCollection) {
					let oItems = oUploadCollection.getItems();
					if (oItems.length > 0) {
						for (const oListItem of oItems) {
							oListItem.setVisibleDelete(false);
						}
					}
				}

			}.bind(this);
			reader.readAsDataURL(oFile);
		},
		_onUploadTerminated: function (oEvent) {
			MessageBox.show("Olá");
		},
		_onFileSizeExceed: function (oEvent) {
			const oFiles = oEvent.getParameter("files");
			const oBundle = this._onFilenameLengthExceed();

			if (oFiles && oFiles.length > 0) {
				const sErrorMsg = oBundle.getText("errorFileSizeExceed", oFiles[0].name);
				MessageBox.error(sErrorMsg, {
					title: oBundle.getText("errorTitle")
				});
			}
		},
		_onFilenameLengthExceed: function (oEvent) {
			const oFiles = oEvent.getParameter("files");
			const oBundle = this._onFilenameLengthExceed();

			if (oFiles && oFiles.length > 0) {
				const sErrorMsg = oBundle.getText("errorFileNameExceed", oFiles[0].name);
				MessageBox.error(sErrorMsg, {
					title: oBundle.getText("errorTitle")
				});
			}
		},
		_getResourceBundle: function () {
			const oView = this.getView();
			return oView.getModel("i18n").getResourceBundle();
		},
		_onFileDeleted: function (oEvent) {
			const oItem = oEvent.getParameter("item");
			const sFileName = oItem.getFileName();
			let oFiles = this.getView().getModel("files");
			let aFilesOld = oFiles.aFiles;

			let aFilesNew = aFilesOld.map(oFile => {
				if (oFile.Name !== sFileName) {
					return oFile;
				}
			});

			this._setModelFilesData(aFilesNew);
		},
		_setModelFilesData: function (aFiles) {
			let oJsonModel = new JSONModel({
				aFiles
			});
			this.getView().setModel(oJsonModel, "files");
		},
		_resetValueStateTicketFields: function(){
			let oTicketText = Fragment.byId("newTicketFragmentIdLoad", "textAreaTicketTextId");
			let oInputSubject = Fragment.byId("newTicketFragmentIdLoad", "inputSubjectId");
			let oComboBoxCategory  = Fragment.byId("newTicketFragmentIdLoad", "comboBoxCategoryId");
			let oComboBoxUnits	= Fragment.byId("newTicketFragmentIdLoad", "comboBoxUnitId");

			if (oTicketText){
				oTicketText.setValueState(sap.ui.core.ValueState.None);
			}
			
			if (oInputSubject){
				oInputSubject.setValueState(sap.ui.core.ValueState.None);
			}
			if (oComboBoxCategory){
				oComboBoxCategory.setValueState(sap.ui.core.ValueState.None);
			}
			if (oComboBoxUnits){
				oComboBoxUnits.setValueState(sap.ui.core.ValueState.None);
			}									
		},
		_initServiceCategoryComboxBox: function(){

			let oComboBoxCategoryId = Fragment.byId("newTicketFragmentIdLoad", "comboBoxCategoryId");

			let oItemsTemplate = new sap.ui.core.Item({
				"text": "{serviceIssueCategory>value}",
				"key": "{serviceIssueCategory>key}"
			});

			oComboBoxCategoryId.bindItems("serviceIssueCategory>/serviceIssueCategory", oItemsTemplate);
		},
		_loadServiceIssueCategory: function(){
			let oJSONModel = new JSONModel();
			oJSONModel.loadData("/webapp/data/serviceIssueCategory.json");
			this.getView().setModel(oJSONModel,"serviceIssueCategory");
		},
		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.getOwnerComponent().readLocalStorage();
			this.oRouter.getTarget("Tickets").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

		}
	});
}, /* bExport= */ true);