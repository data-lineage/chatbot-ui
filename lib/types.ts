export interface NodeProperty {
  name: string;
  type: string;
}

export interface Relationship {
  source: string;
  type: string;
  dest: string;
}

export interface FulltextIndex {
  node_label: string;
  property: string;
  index_name: string;
}

export interface SchemaData {
  catalogs: string[];
  node_labels: string[];
  properties: Record<string, NodeProperty[]>;
  relationships: Relationship[];
  fulltext_indexes: FulltextIndex[];
  schema_text: string;
}
