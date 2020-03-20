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

import '../screens/modeling/modeling-home';
import '../screens/datasets/datasets-home';
import '../screens/regions/regions-home';
import '../screens/models/models-home';
import '../screens/analysis/analysis-home';
import '../screens/variables/variables-home';
import '../screens/messages/messages-home';
import '../screens/emulators/emulators-home';

import { SharedStyles } from '../styles/shared-styles';
import { showDialog, hideDialog, formElementsComplete } from '../util/ui_functions';
import { User } from 'firebase';
import { Region } from 'screens/regions/reducers';

@customElement('mint-app')
export class MintApp extends connect(store)(LitElement) {
  @property({type: String})
  appTitle = '';

  @property({type: String})
  private _page = '';

  @property({type:Boolean})
  private _drawerOpened = false;

  @property({type: Object})
  private user!: User;

  @property({type: Object})
  private _selectedRegion? : Region;

  private _dispatchedSubRegionsQuery : boolean = false;

  private _loggedIntoWings = false;

  private _dispatchedConfigQuery = false;
  
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
      .message-button {
        --button-padding: 6px;
      }
      .message-button.selected {
        background-color: rgb(98, 155, 48);
        color: white;
      }
      .message-button.selected:hover {
        background-color: rgb(98, 155, 48);
      }
      .message-button:hover {
        background-color: rgb(224, 224, 224);
      }
      `
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
          <ul class="breadcrumbs">
            <a href="${this._selectedRegion ? this._selectedRegion.id : ""}/home"
                class=${(this._page == 'home' ? 'active' : '')}>
                <div style="vertical-align:middle">
                  ▶
                  ${this._selectedRegion ? 
                    this._selectedRegion.name.toUpperCase() : "Select Region"}
                </div>
            </a>
            ${!this.user || !this._selectedRegion ? 
              "" : 
              html`
              <a href='${this._selectedRegion.id}/regions'
                  class=${(this._page == 'regions'? 'active': '')}
                >Explore Areas</a>                
              <a href='${this._selectedRegion.id}/models'
                  class=${(this._page == 'models'? 'active': '')}
                >Prepare Models</a>
              <a href='${this._selectedRegion.id}/datasets'
                  class=${(this._page == 'datasets'? 'active': '')}
                >Browse Datasets</a>                  
              <a href='${this._selectedRegion.id}/modeling'
                  class=${(this._page == 'modeling') ? 'active': ''}
                class="active">Use Models</a>
              <a href='${this._selectedRegion.id}/analysis/report'
                  class=${(this._page == 'analysis'? 'active': '')}
                >Prepare Reports</a>
              `
            }
          </ul>
        </div>
        <div slot="right">
          ${this.user == null ? 
            html`
            ${this._selectedRegion ? 
              html`
              <wl-button flat inverted class="message-button ${this._page == 'emulators' ? 'selected' : ''}" @click="${() => goToPage('emulators')}">
                Emulators <wl-icon style="margin-left: 4px;">settings</wl-icon>
              </wl-button>
              ` : ""
            }
            <wl-button flat inverted @click="${this._showLoginWindow}">
              LOGIN &nbsp;
              <wl-icon alt="account">account_circle</wl-icon>
            </wl-button>
            `
            :
            html `
            ${this._selectedRegion ? 
              html`
              <wl-button flat inverted class="message-button ${this._page == 'messages' ? 'selected' : ''}" @click="${() => goToPage('messages')}">
                Messages <wl-icon style="margin-left: 4px;">message</wl-icon>
              </wl-button>              
              &nbsp;
              <wl-button flat inverted class="message-button ${this._page == 'emulators' ? 'selected' : ''}" @click="${() => goToPage('emulators')}">
                Emulators <wl-icon style="margin-left: 4px;">settings</wl-icon>
              </wl-button>
              ` : ""
            }

            <wl-button flat inverted @click="${signOut}">
              LOGOUT ${this.user.email}
            </wl-button>
            `
          }
        </div>
      </wl-nav>

      ${this.user ? 
        html `
        <div class="sectionframe">
          <div id="right">
            <div class="card">
              <!-- Main Pages -->
              <app-home class="page fullpage" ?active="${this._page == 'home'}"></app-home>
              <datasets-home class="page fullpage" ?active="${this._page == 'datasets'}"></datasets-home>
              <regions-home class="page fullpage" ?active="${this._page == 'regions'}"></regions-home>
              <variables-home class="page fullpage" ?active="${this._page == 'variables'}"></variables-home>
              <models-home class="page fullpage" ?active="${this._page == 'models'}"></models-home>
              <modeling-home class="page fullpage" ?active="${this._page == 'modeling'}"></modeling-home>
              <analysis-home class="page fullpage" ?active="${this._page == 'analysis'}"></analysis-home>
              <messages-home class="page fullpage" ?active="${this._page == 'messages'}"></messages-home>
              <emulators-home class="page fullpage" ?active="${this._page == 'emulators'}"></emulators-home>
            </div>
          </div>
        </div>
        `
        :
        html `
          <div class="sectionframe">
            <div id="right">
              <div class="card">
                <!-- Main Pages -->
                <app-home class="page fullpage" ?active="${this._page == 'home'}"></app-home>
                <emulators-home class="page fullpage" ?active="${this._page == 'emulators'}"></emulators-home>
              </div>
            </div>
          </div>
        `
      }
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
    store.dispatch(fetchUser());
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
    this.user = state.app!.user!;

    if(!state.app.prefs || !state.app.prefs.mint) {
      if(!this._dispatchedConfigQuery) {
        console.log("Fetching config");
        this._dispatchedConfigQuery = true;
        store.dispatch(fetchMintConfig());
      }
    }
    
    if(!state.regions || !state.regions.top_region_ids) {
      // Fetch top regions
      store.dispatch(listTopRegions());
    }
    else if (state.regions && state.regions.regions) {
      let regionid = state.ui.selected_top_regionid;
      // If a region is selected, then fetch it's subregions
      this._selectedRegion = state.regions.regions[regionid];
      if(regionid && !this._dispatchedSubRegionsQuery
          && (!state.regions.sub_region_ids || !state.regions.sub_region_ids[regionid])) {
        this._dispatchedSubRegionsQuery = true;
        store.dispatch(listSubRegions(regionid));
      }
      else if(state.regions.sub_region_ids && state.regions.sub_region_ids[regionid]) {
        this._dispatchedSubRegionsQuery = false;
      }
    }
  }
}
