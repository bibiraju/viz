import * as React from 'react';
import JSONViewer from 'react-json-viewer';
import { Panel, Button } from 'react-bootstrap';
import { StompSubscription } from '@stomp/stompjs';

import { MessageService } from '../services/MessageService';
import { GetApplicationsAndServicesPayload } from '../models/message-requests/GetApplicationsAndServicesRequest';
import './ApplicationsView.styles.scss';
export interface ApplicationsProps { }
const MESSAGE_SERVICE: MessageService = MessageService.getInstance();
interface State {
  open: boolean;
  appData: string;
  serviceData: string,
  appInstanceData: string,
  serviceInstanceData: string

}
export class ApplicationsView extends React.Component<ApplicationsProps, State> {

    constructor(props: any) {
        super(props);
        this.state = {
            open: true,
            appData: '',
            serviceData: '',
            appInstanceData: '',
            serviceInstanceData: ''
        }
      }
    componentDidMount() {
        this._fetchApplicationsAndServices();
        
      }
    
    render() {
      if (this.state.appData.length > 0) {
        const { appData, serviceData, appInstanceData, serviceInstanceData } = this.state;
        return (
            <div className='applications-view'>
              
                <Button bsStyle="primary" bsSize="large" onClick={() => this.setState({ open: !this.state.open })}>
                  Applications
                </Button>
                <br />
                <Panel id="collapsible-applications" collapsible expanded={this.state.open}>
                  <JSONViewer json={ appData } /> 
                </Panel>
                <Button bsStyle="primary" bsSize="large" onClick={() => this.setState({ open: !this.state.open })}>
                  Services
                </Button>
                <br />
                <Panel id="collapsible-applications" collapsible expanded={this.state.open}>
                  <JSONViewer json={ serviceData } />  
                </Panel>                
                <Button bsStyle="primary" bsSize="large" onClick={() => this.setState({ open: !this.state.open })}>
                  Application Instances
                </Button>
                <br />
                <Panel id="collapsible-applications" collapsible expanded={this.state.open}>
                  <JSONViewer json={ appInstanceData } />
                </Panel>
                <Button bsStyle="primary" bsSize="large" onClick={() => this.setState({ open: !this.state.open })}>
                  Service Instances
                </Button>
                <br />
                <Panel id="collapsible-applications" collapsible expanded={this.state.open}>
                  <JSONViewer json={ serviceInstanceData } /> 
                </Panel>
                           
            </div>
        )
      }
      return null;
    }
    private _fetchApplicationsAndServices() {
       /* if (sessionStorage.getItem('appData')) {
          const appData = JSON.parse(sessionStorage.getItem('appData'));
          this.setState({ appData });
        }
        else {*/
          const repeater = setInterval(() => {
            if (MESSAGE_SERVICE.isActive()) {
              const sub: StompSubscription = MESSAGE_SERVICE.onApplicationsAndServicesReceived((payload: GetApplicationsAndServicesPayload) => {
                const appData = payload.applications;
                const serviceData = payload.services;
                const appInstanceData = payload.appInstances;
                const serviceInstanceData = payload.serviceInstances;


                this.setState({ appData, serviceData, appInstanceData, serviceInstanceData });
                sub.unsubscribe();
                sessionStorage.setItem('appData', JSON.stringify(appData));
                sessionStorage.setItem('appData', JSON.stringify(serviceData));
                sessionStorage.setItem('appData', JSON.stringify(appInstanceData));
                sessionStorage.setItem('appData', JSON.stringify(serviceInstanceData));

              });
              MESSAGE_SERVICE.fetchApplicationsAndServices();
              clearInterval(repeater);
            }
          }, 500);
        //}
      }
}