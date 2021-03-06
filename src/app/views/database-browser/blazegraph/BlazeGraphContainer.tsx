import * as React from 'react';
import { connect } from 'react-redux';

import { BlazeGraph } from './BlazeGraph';
import { AppState } from '../../../models/AppState';
import { MRID } from '../../../models/MRID';
import { QueryBlazeGraphRequestBody, QueryBlazeGraphRequestType } from '../../../models/message-requests/QueryBlazeGraphRequest';
import { MessageService } from '../../../services/MessageService';
import { StompSubscription } from '@stomp/stompjs';


interface Props {
  mRIDs: MRID[];
}

interface State {
  response: any;
  isFetching: boolean;
}

const mapStateToProps = (state: AppState) => ({
  mRIDs: state.mRIDs
});

let blazeGraphSubscription: StompSubscription = null;

export const BlazeGraphContainer = connect(mapStateToProps)(class BlazeGraphContainer extends React.Component<Props, State> {
  private readonly _messageService = MessageService.getInstance();

  constructor(props: any) {
    super(props);
    this.state = {
      response: null,
      isFetching: false
    };

    this._queryBlazeGraph = this._queryBlazeGraph.bind(this);
  }

  componentDidMount() {
    if (blazeGraphSubscription) {
      blazeGraphSubscription.unsubscribe();
      blazeGraphSubscription = null;
    }
    const repeater = setInterval(() => {
      if (this._messageService.isActive()) {
        blazeGraphSubscription = this._messageService.onBlazeGraphDataReceived((payload) => {
          this.setState({ response: payload.data }, () => this.setState({ isFetching: false }));
        });
        clearInterval(repeater);
      }
    }, 500);
  }
  render() {
    return (
      <BlazeGraph
        mRIDs={this.props.mRIDs}
        onSubmit={this._queryBlazeGraph}
        response={this.state.response}
        isResponseReady={!this.state.isFetching} />
    );
  }

  private _queryBlazeGraph(requestBody: QueryBlazeGraphRequestBody) {
    this.setState({ isFetching: true });
    const cleanedUpRequestBody = {
      requestType: requestBody.requestType,
      resultFormat: requestBody.resultFormat
    } as QueryBlazeGraphRequestBody;

    switch (requestBody.requestType) {
      case QueryBlazeGraphRequestType.QUERY:
        cleanedUpRequestBody.queryString = requestBody.queryString;
        break;
      case QueryBlazeGraphRequestType.QUERY_MODEL:
        cleanedUpRequestBody.modelId = requestBody.modelId;
        cleanedUpRequestBody.filter = requestBody.filter;
        break;
      case QueryBlazeGraphRequestType.QUERY_MODEL_NAMES:
        break;
      case QueryBlazeGraphRequestType.QUERY_OBJECT:
        cleanedUpRequestBody.objectId = requestBody.objectId;
        break;
      case QueryBlazeGraphRequestType.QUERY_OBJECT_TYPES:
        cleanedUpRequestBody.modelId = requestBody.modelId;
        break;
    }
    this._messageService.fetchDataFromBlazeGraph(cleanedUpRequestBody);
  }
});