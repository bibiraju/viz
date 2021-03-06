import * as React from 'react';

import './Wait.styles.scss';

interface Props {
  show: boolean;
}

interface State {
}

export class Wait extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
    };
  }
  render() {
    if (this.props.show)
      return (
        <div className='wait'>
          <div className='backdrop visible' />
          <div className='dots'>
            <span className='dot' />
            <span className='dot' />
            <span className='dot' />
            <span className='dot' />
            <span className='dot' />
            <span className='dot' />
            <span className='dot' />
            <span className='dot' />
            <span className='dot' />
          </div>
        </div>
      );
    return null;
  }
}