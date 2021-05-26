import { CatchClause } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, Node } from "./Node";

export class CatchClauseNode implements Node {
    type: string;
    uri: string;
    astNode: CatchClause;

    nameLoc?: Location | undefined;

    expressionNode?: Node | undefined;
    declarationNode?: Node | undefined;

    connectionTypeRules: string[] = [];

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (catchClause: CatchClause, uri: string) {
        this.type = catchClause.type;
        this.uri = uri;
        this.astNode = catchClause;
    }

    getTypeNodes(): Node[] {
        let nodes: Node[] = [];

        this.typeNodes.forEach(typeNode => {
            nodes = nodes.concat(typeNode.getTypeNodes());
        });

        return nodes;
    }

    addTypeNode(node: Node): void {
        this.typeNodes.push(node);
    }

    getExpressionNode(): Node | undefined {
        return this.expressionNode;
    }

    setExpressionNode(node: Node | undefined): void {
        this.expressionNode = node;
    }

    getDeclarationNode(): Node | undefined {
        return this.declarationNode;
    }

    setDeclarationNode(node: Node | undefined): void {
        this.declarationNode = node;
    }

    getDefinitionNode(): Node | undefined {
        return this.parent?.getDefinitionNode();
    }

    getName(): string | undefined {
        return undefined;
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node | undefined): void {
        this.parent = parent;
    }

    getParent(): Node | undefined {
        return this.parent;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        for (const param of this.astNode.parameters || []) {
            find(param, this.uri).accept(find, orphanNodes, this);
        }

        find(this.astNode.body, this.uri).accept(find, orphanNodes, this);

        parent?.addChild(this);

        return this;
    }
}
