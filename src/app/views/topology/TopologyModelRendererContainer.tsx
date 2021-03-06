import * as React from 'react';
import { connect } from 'react-redux';
import { StompSubscription } from '@stomp/stompjs';

import { TopologyModelRenderer } from './TopologyModelRenderer';
import { MessageService } from '../../services/MessageService';
import { TopologyModel } from '../../models/topology/TopologyModel';
import { SimulationControlService } from '../../services/SimulationControlService';
import { AppState } from '../../models/AppState';
import { SimulationConfig } from '../../models/SimulationConfig';
import { RequestConfigurationType } from '../../models/message-requests/RequestConfigurationType';
import { GetTopologyModelRequestPayload } from '../../models/message-requests/GetTopologyModelRequest';

import './TopologyModelRenderer.styles.scss';
interface Props {
  simulationConfig: SimulationConfig;
}

interface State {
  topology: { nodes: any[], links: any[] };
  isFetching: boolean;
}

const mapStateToProps = (state: AppState): Props => ({
  simulationConfig: state.activeSimulationConfig
} as Props);

let topologySubscription: StompSubscription = null;
const TOPOLOGY_CACHE = {};
export const TopologyModelRendererContainer = connect(mapStateToProps)(class TopologyModelRendererContainer extends React.Component<Props, State> {

  private readonly _messageService = MessageService.getInstance();
  private readonly _simulationControlService = SimulationControlService.getInstance();

  constructor(props: any) {
    super(props);
    this.state = {
      topology: null,
      isFetching: true
    };
  }

  componentDidMount() {
    if (topologySubscription) {
      topologySubscription.unsubscribe();
      topologySubscription = null;
    }

    if (this.props.simulationConfig && this.props.simulationConfig.power_system_config.Line_name in TOPOLOGY_CACHE)
      this.setState({
        topology: TOPOLOGY_CACHE[this.props.simulationConfig.power_system_config.Line_name],
        isFetching: false
      });
    else {
      topologySubscription = this._messageService.onTopologyModelReceived((payload: GetTopologyModelRequestPayload) => {
        if (payload.requestType === RequestConfigurationType.GRID_LAB_D_SYMBOLS) {
          if (typeof payload.data === 'string')
            payload.data = JSON.parse(payload.data);
          const topology = this._transformModel(payload.data);
          this.setState({
            topology,
            isFetching: false
          });
          TOPOLOGY_CACHE[this.props.simulationConfig.power_system_config.Line_name] = topology;
        }
      });
    }

  }

  render() {
    return (
      <TopologyModelRenderer
        topology={this.state.topology}
        showWait={this.state.isFetching}
        onStartSimulation={() => this._simulationControlService.startSimulation(this.props.simulationConfig)}
        topologyName={this.props.simulationConfig.simulation_config.simulation_name}
      />
    );
  }

  private _transformModel(model: TopologyModel, ): { nodes: any[], links: any[] } {
    if (!model || model.feeders.length === 0)
      return null;
    const knownNodesByName = {};
    const nodes = [];
    const links = [];

    const regulatorParentsPerSimulatioName = {
      ieee8500: {
        VREG3: 'l2692633',
        VREG4: 'm1089120',
        VREG2: 'l2841632',
        FEEDER_REG: 'm1209814'
      },
      ieee123: {
        reg2: '9r',
        reg3: '25r',
        reg4: '160r'
      }
    }

    const groupNames = ['batteries', 'switches', 'solarpanels', 'swing_nodes', 'transformers', 'overhead_lines',
      'capacitors', 'regulators'
    ];
    // Create top-level elements
    const feeder = model.feeders[0];
    for (const groupName of groupNames) {
      switch (groupName) {
        case 'swing_nodes':
        case 'transformers':
          for (const element of feeder[groupName])
            nodes.push({
              name: element.name,
              type: feeder[groupName].type,
              data: element,
              children: []
            });
          break;
        case 'capacitors':
          for (const capacitor of feeder[groupName]) {
            const parent = knownNodesByName[capacitor.parent];
            if (parent)
              parent.children.push({
                name: capacitor.name,
                type: 'capacitors',
                data: capacitor,
                children: []
              });
            else
              console.log('Missing capacitor parent ' + capacitor.parent);
          }
          break;
        case 'overhead_lines':
          for (const overheadLine of feeder[groupName]) {
            const fromNode = _getOrCreateElement(overheadLine.from, 'node', knownNodesByName);
            const toNode = _getOrCreateElement(overheadLine.to, 'node', knownNodesByName);
            nodes.push(fromNode, toNode);
            if (overheadLine.x1 !== 0.0 && overheadLine.y1 !== 0.0 && overheadLine.x2 !== 0.0 && overheadLine.y2 !== 0.0) {
              fromNode.x = overheadLine.x1;
              fromNode.y = overheadLine.y1;
              toNode.x = overheadLine.x2;
              toNode.y = overheadLine.y2;
            }
            links.push({
              name: overheadLine.name,
              from: fromNode,
              to: toNode,
              data: overheadLine
            });
          }
          break;
        case 'regulators':
          const simulationName = this.props.simulationConfig.simulation_config.simulation_name;

          for (const regulator of feeder[groupName]) {
            const parent = knownNodesByName[regulatorParentsPerSimulatioName[simulationName][regulator.name]];
            if (parent)
              parent.children.push({
                name: regulator.name,
                type: 'regulators',
                data: regulator,
                children: []
              });
            else
              console.log('Missing regulator parent ' + regulatorParentsPerSimulatioName[simulationName][regulator.name] + ' for ' + regulator.name);
          }
          break;
        default:
          console.warn(`${groupName} is in the model, but there's no switch case for it. Skipping`);
          break;
      }
    }

    return { nodes, links };
  }
});



function _getOrCreateElement(name, type, map) {
  let existingNode = map[name];
  if (!existingNode) {
    existingNode = { name, type, data: {}, children: [] };
    map[name] = existingNode;
  }
  return existingNode;
}