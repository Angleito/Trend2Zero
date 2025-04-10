import type { Schema, Struct } from '@strapi/strapi';

export interface IndexIndicies extends Struct.ComponentSchema {
  collectionName: 'components_index_indicies';
  info: {
    displayName: 'Indicies';
  };
  attributes: {
    Change: Schema.Attribute.Decimal;
    Name: Schema.Attribute.String;
    Value: Schema.Attribute.Decimal;
  };
}

export interface TopMoverTopMover extends Struct.ComponentSchema {
  collectionName: 'components_top_mover_top_movers';
  info: {
    displayName: 'TopMover';
  };
  attributes: {
    Change: Schema.Attribute.Decimal;
    ChangePercent: Schema.Attribute.Decimal;
    Name: Schema.Attribute.String;
    Price: Schema.Attribute.Decimal;
    Symbol: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'index.indicies': IndexIndicies;
      'top-mover.top-mover': TopMoverTopMover;
    }
  }
}
