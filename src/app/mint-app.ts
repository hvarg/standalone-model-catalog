/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { LitElement, html, property, PropertyValues, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { installRouter } from 'pwa-helpers/router';
import { updateMetadata } from 'pwa-helpers/metadata';

// This element is connected to the Redux store.
import { store, RootState } from './store';

// These are the actions needed by this element.
import {
  navigate, fetchUser, signOut, signIn, goToPage, fetchMintConfig,
} from './actions';
import { listTopRegions, listSubRegions } from '../screens/regions/actions';

import { modelsGet, versionsGet, modelConfigurationsGet, modelConfigurationSetupsGet, processesGet, 
         regionsGet, imagesGet } from 'model-catalog/actions';

import { SharedStyles } from '../styles/shared-styles';
import { showDialog, hideDialog, formElementsComplete } from '../util/ui_functions';
import { User } from 'firebase';
import '../screens/models/models-home';
import '../screens/models/model-explore/model-explore';
import './mint-about';
import 'weightless/nav'
import 'weightless/title'

@customElement('mint-app')
export class MintApp extends connect(store)(LitElement) {
  @property({type: String})
  appTitle = '';

  @property({type: String})
  private _page = '';

  @property({type: String})
  private _subpage = '';

  @property({type: String})
  private _selectedModel = '';

  @property({type:Boolean})
  private _drawerOpened = false;

  @property({type:Boolean})
  private _infoActive = true;

  @property({type: Object})
  private user!: User;

  _once = false;

  static get styles() {
    return [
      SharedStyles,
      css`
      .appframe {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
      }

      .sectionframe {
        display: flex;
        height: 100%;
        width: 100%;
        overflow: auto;
        background: #F6F6F6;
      }

      div#left {
        top: 0;
        bottom: 0;
        left: 0;
        background-color: #06436c;
        color: white;
        width: 0px;
        overflow: auto;
        transition: width 0.2s;
      }

      div#left.open {
        display: block;
        width: 400px;
      }

      div#right {
        top: 0;
        bottom: 0;
        width: 100%;
        transition: width 0.2s;
      }

      .card {
        height: calc(100% - 100px);
        overflow: auto;
      }
      
      .breadcrumbs {
        margin-left: 0px;
      }

      .breadcrumbs a.active {
        background-color: #629b30;
        color: white;
      }
      .breadcrumbs a.active:before {
        border-color: #629b30;
        border-left-color: transparent;
      }
      .breadcrumbs a.active:after {
        border-left-color: #629b30;
      }

      .breadcrumbs a:first {
        background-color: #629b30;
        color: white;
      }
      .breadcrumbs a:first:before {
        border-color: #629b30;
        border-left-color: transparent;
      }
      .breadcrumbs a:first:after {
        border-left-color: #629b30;
      }

      #info {
        margin: 0 auto;
        background: #f0f0f0;
        width: calc(75% - 40px);
        border-radius: 1em;
        padding: 10px 20px;
      }

      #info wl-icon {
          float: right;
          cursor: pointer;
          color: #B8B8B8;
      }

      #info wl-icon:hover {
          color: black;
      }

      #info > div.cont {
          padding: 25px 10px 10px 10px;
      }

    #back-button {
        padding: 4px 4px 4px 10px;
        border-radius: 0;
        background: rgb(240, 240, 240);
    }   

    #back-button:hover {
        background-color: rgb(224, 224, 224);
    }`
    ];
  }

  protected render() {
    // Anything that's related to rendering should be done in here.
    return html`
    <!-- Overall app layout -->

    <div class="appframe">
      <!-- Navigation Bar -->
      <wl-nav>
        <div slot="title">
            <wl-button id="back-button" flat inverted @click="${()=>goToPage('home')}" ?disabled="${this._page === 'home'}">
                <wl-icon>arrow_back_ios</wl-icon>
            </wl-button>
        
            <ul class="breadcrumbs">
              <a href="/home"
                  class=${(this._page == 'home' ? 'active' : '')}>
                  <div style="vertical-align:middle">
                    Model catalog
                  </div>
              </a>
              ${(this._selectedModel && !(this._page == 'home' || this._page == 'about'))?
                    html`<a class="active">${this._selectedModel.split('/').pop()}</a>` : html``}
            </ul>

        </div>

        <div slot="right">
        <wl-button flat inverted class="message-button ${this._page == 'configure' ? 'selected' : ''}" 
                   @click="${() => goToPage('models/configure')}">
            Configure model <wl-icon style="margin-left: 4px;">settings</wl-icon>
        </wl-button>

          ${this.user == null ? 
            html`
            <wl-button flat inverted @click="${this._showLoginWindow}">
              LOGIN &nbsp;
              <wl-icon alt="account">account_circle</wl-icon>
            </wl-button>
            `
            :
            html `
            <wl-button flat inverted @click="${signOut}">
              LOGOUT ${this.user.email}
            </wl-button>
            `
          }
        </div>

        <wl-button style="padding: 0px 5px;" flat inverted slot="right" @click="${()=>goToPage('about')}">
          <img style="margin-left: 6px;" height="40" src="/images/logo.png">
        </wl-button>
      </wl-nav>

        <div class="sectionframe">
          <div id="right">
            <div class="card">
              <!-- Main Pages -->
              <mint-about class="page fullpage" ?active="${this._page == 'about'}"></mint-about>
              ${(this._page == 'home' && this._infoActive) ? html`
              <div id="info">
                <div> <wl-icon @click="${()=>{this._infoActive = false;}}">clear<wl-icon> </div>
                <div class="cont"> 
                    <p>The <b>MINT Model Explorer</b> is an application for finding and exploring software models 
                    and metadata available in the MINT Model Catalog.</p>
                    <p>We are currently adding new models and metadata, so this is work in progress.
                        Click <a href="/about">here</a> to know more.
                    </p>
                    <br/>
                    <p>We <b>recommend using the MINT Model Explorer in Chrome.</b></p>
                </div>
              </div>
              ` : html``}
              ${console.log(this._page, this._subpage)}
              <model-explorer class="page fullpage" style="height:100%;"
                              ?active="${this._page != 'about' && this._subpage != 'configure'}"></model-explorer>
              <models-configure class="page fullpage" style="height:100%" ?active="${this._subpage == 'configure'}"></models-configure>
            </div>
          </div>
        </div>
    </div>

    ${this._renderDialogs()}
    `;
  }

  _renderDialogs() {
    return html`
    <wl-dialog id="loginDialog" fixed backdrop blockscrolling>
      <h3 slot="header">Please enter your username and password for MINT</h3>
      <div slot="content">
        <p></p>      
        <form id="loginForm">
          <div class="input_full">
            <label>Username</label>
            <input name="username" type="text"></input>
          </div>
          <p></p>
          <div class="input_full">
            <label>Password</label>
            <input name="password" type="password"></input>
          </div>

        </form>
      </div>
      <div slot="footer">
          <wl-button @click="${this._onLoginCancel}" inverted flat>Cancel</wl-button>
          <wl-button @click="${this._onLogin}" class="submit" id="dialog-submit-button">Submit</wl-button>
      </div>
    </wl-dialog>
    `;
}

  _showLoginWindow() {
    showDialog("loginDialog", this.shadowRoot!);
  }

  _onLoginCancel() {
    hideDialog("loginDialog", this.shadowRoot!);
  }

  _onLogin() {
    let form:HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#loginForm")!;
    if(formElementsComplete(form, ["username", "password"])) {
        let username = (form.elements["username"] as HTMLInputElement).value;
        let password = (form.elements["password"] as HTMLInputElement).value;
        signIn(username, password);
        this._onLoginCancel();
    }
  }

  _toggleDrawer() {
    this._drawerOpened = !this._drawerOpened;
    var left = this.shadowRoot!.getElementById("left");
    left!.className = "left" + (this._drawerOpened ? " open" : "");
  }

  protected firstUpdated() {
    installRouter((location) => store.dispatch(navigate(decodeURIComponent(location.pathname))));
    /*store.dispatch(fetchModels());
    store.dispatch(fetchVersionsAndConfigs());
    store.dispatch(fetchUser());
    store.dispatch(fetchUserPreferences());
    store.dispatch(listTopRegions());*/
        store.dispatch(modelsGet());
        store.dispatch(versionsGet());
        store.dispatch(modelConfigurationsGet());
        store.dispatch(modelConfigurationSetupsGet());
        store.dispatch(regionsGet());
        store.dispatch(imagesGet());
  }

  protected updated(changedProps: PropertyValues) {
    if (changedProps.has('_page')) {
      const pageTitle = this.appTitle + ' - ' + this._page;
      updateMetadata({
        title: pageTitle,
        description: pageTitle
        // This object also takes an image property, that points to an img src.
      });
    }
  }


  stateChanged(state: RootState) {
    this._page = state.app!.page;
    this._subpage = state.app!.subpage;
    if (state.explorerUI && state.explorerUI.selectedModel != this._selectedModel) {
        this._selectedModel = state.explorerUI.selectedModel;
    }
    this.user = state.app!.user!;
  }
}
