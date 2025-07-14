declare module 'react-linkify' {
    import * as React from 'react';
  
    interface LinkifyProps {
      componentDecorator?: (
        decoratedHref: string,
        decoratedText: string,
        key: number
      ) => React.ReactNode;
      properties?: object;
      children?: React.ReactNode;
    }
  
    export default class Linkify extends React.Component<LinkifyProps, any> {}
  }
  