sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"com/gcb/ironhouse/app/model/models",
	"./model/errorHandling"
], function(UIComponent, Device, models, errorHandling) {
	"use strict";

	var navigationWithContext = {
		"ServiceRequestCollection": { "Ticket":"" },
		"UnidadeSet": { "Unidades":"" }, 
		"Unidade": { "Unidade": "" }
	};

	return UIComponent.extend("com.gcb.ironhouse.app.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {
			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			// set the FLP model
			this.setModel(models.createFLPModel(), "FLP");

/* 			// set the dataSource model
			this.setModel(new sap.ui.model.json.JSONModel({
				"uri": "/here/goes/your/serviceUrl/local/"
			}), "dataSource");
 */
			// set application model
			var oApplicationModel = new sap.ui.model.json.JSONModel({});
			this.setModel(oApplicationModel, "applicationModel");

			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// create the views based on the url/hash
			let oRouter = this.getRouter();
			oRouter.initialize();
			// delegate error handling
			errorHandling.register(this);
			
		},
		readLocalStorage: function(){
			
			let oModelIronHouse = this.getModel("IronHouse");
			let oHeader = oModelIronHouse.getHeaders();
			if (!oHeader.Authorization){
				let vToken = this._readTokenFromLocalStorage();
				this.setIronHouseAuthorizationHeader(vToken);
				let oUserInfo = this._readUserInfoFromLocalStorage();
				this.setModel(models.createUserInfoModel(oUserInfo),"UserInfo");	
			}
		},
		setIronHouseAuthorizationHeader: function(vToken){
			
			this.setTokenSession(vToken);
			let oModelIronHouse = this.getModel("IronHouse");
			oModelIronHouse.setHeaders({ "Authorization": vToken });
		},
		_readTokenFromLocalStorage: function(){
			let oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.session);
			//Get data from Storage
			if (oStorage){
				return oStorage.get("token");		
			} else {
				return "";
			}
			
		},
		_readUserInfoFromLocalStorage: function(){
			let oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			//Get data from Storage
			if (oStorage){
				return oStorage.get("UserInfo");		
			} else {
				return "";
			}
		},
		setTokenSession:function(vToken){
			let oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.session);
			if (oStorage){
				oStorage.put("token",vToken);
			}
		},
		clearLocalStorage:function(){
			let oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);	
			if(oStorage){
				oStorage.removeAll();	
			}
			
			oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.session);	
			if(oStorage){
				oStorage.removeAll();
			}
		},
	
		createContent: function() {
			var app = new sap.m.App({
				id: "App"
			});
			var appType = "App";
			var appBackgroundColor = "";
			if (appType === "App" && appBackgroundColor) {
				app.setBackgroundColor(appBackgroundColor);
			}

			return app;
		},

		getNavigationPropertyForNavigationWithContext: function(sEntityNameSet, targetPageName) {
			var entityNavigations = navigationWithContext[sEntityNameSet];
			return entityNavigations == null ? null : entityNavigations[targetPageName];
		},

		setUserInfo: function(oUserInfo){
			let sNameInitials = oUserInfo.Nome.split(" ").map((sValue,iIndex, aArray) =>{
				if (iIndex === 0 ){
					return sValue[0].toUpperCase();
				}else{
					let iLastIndex = aArray.length - 1;
					if( iIndex === iLastIndex ){
						return sValue[0].toUpperCase();
					}
					else{
						return "";
					}
				}
			}).join("");
			oUserInfo.Iniciais = sNameInitials;
			this.setModel(models.createUserInfoModel(oUserInfo),"UserInfo");
			
			let oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			if (oStorage){
				oStorage.put("UserInfo",oUserInfo);
			}
			
		},
		setUserInfoUUID: function(sUUID){
			if (sUUID){
				let oModel = this.getModel("UserInfo");
				let oData = oModel.getData();
				oData.UUID = sUUID;
			}
		}

	});

});
