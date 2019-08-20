
import { html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';

@customElement('datasets-quality-workflows')
export class DatasetsQualityWorkflows extends connect(store)(PageViewElement) {

    static get styles() {
        return [
            css `
            .cltrow wl-button {
                padding: 2px;
            }
            `,
            SharedStyles
        ];
    }

    protected render() {
        return html`
        <p>
        This page is in progress, it will allow you to run tools that improve the quality of datasets. 
        Below is an example of the results of a tool that improves the quality of elevation models for a small area of Ethiopia
        </p>
        <ul>
            <li><a href="https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Ethiopia_relief_boundary.png"
                >Ethiopia relief boundary</a>. 
                <a href="http://mint.isi.edu/dev/data/Ethiopia_relief_subbasins_big.png">Ethiopia relief subbasins (94MB)</a>
            </li>
            <li><a href="http://mint.isi.edu/dev/data/Blue_Nile_Tribs_relief_and_boundaries_big.png"
                >Blue Nile Tributaries relief and boundaries (76MB)</a></li>
            <li><a href="https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Guder_relief_rivers_boundary.png"
                >Guder relief rivers boundary</a></li>
            <li><a href="https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Jamma_relief_river_boundary.png"
                >Jamma relief river boundary</a></li>
            <li><a href="https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Muger_relief_rivers_boundary.png"
                >Muger relief rivers boundary</a></li>
            <li><a href="https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Dashilo_relief_river_boundary.png"
                >Dashilo relief river boundary</a></li>
        </ul>
        `
    }
}
