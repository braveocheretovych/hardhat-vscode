import * as fs from "fs";
import * as path from "path";
import { ImportDirective } from "@solidity-parser/parser/dist/src/ast-types";

import { findNodeModules } from "../utils";
import {
    Location,
    FinderType,
    DocumentsAnalyzerMap,
    DocumentsAnalyzerTree,
    Node,
    SourceUnitNode,
    ImportDirectiveNode as IImportDirectiveNode
} from "./Node";

export class ImportDirectiveNode implements IImportDirectiveNode {
    type: string;
    realURI: string;
    uri: string;
    astNode: ImportDirective;

    nameLoc?: Location | undefined;

    aliasName?: string | undefined;

    importNode: Node | undefined;
    aliasNodes: Node[] = [];

    expressionNode?: Node | undefined;
    declarationNode?: Node | undefined;

    connectionTypeRules: string[] = [];

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (importDirective: ImportDirective, uri: string) {
        this.type = importDirective.type;
        this.realURI = uri;

        this.uri = path.join(uri, "..", importDirective.path);

        // See if file exists
        if (!fs.existsSync(this.uri)) {
            const nodeModulesPath = findNodeModules(this.uri);

            if (nodeModulesPath) {
                this.uri = path.join(nodeModulesPath, importDirective.path);
            }
        }

        if (importDirective.pathLiteral && importDirective.pathLiteral.loc) {
            this.nameLoc = importDirective.pathLiteral.loc;
            this.nameLoc.end.column = (this.nameLoc?.end.column || 0) + importDirective.pathLiteral.value.length;
        }

        this.astNode = importDirective;
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

    setImportNode(importNode: Node): void {
        this.importNode = importNode;
    }

    getImportNode(): Node | undefined {
        return this.importNode;
    }

    addAliasNode(aliasNode: Node): void {
        this.aliasNodes.push(aliasNode);
    }

    getAliasNodes(): Node[] {
        return this.aliasNodes;
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
        return this;
    }

    getName(): string | undefined {
        return this.astNode.path;
    }

    getAliasName(): string | undefined {
        return this.aliasName;
    }

    setAliasName(aliasName: string | undefined): void {
        this.aliasName = aliasName;
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

    accept(find: FinderType, documentsAnalyzer: DocumentsAnalyzerMap, documentsAnalyzerTree: DocumentsAnalyzerTree, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        if (!documentsAnalyzerTree[this.uri] && documentsAnalyzer[this.uri]) {
            documentsAnalyzerTree[this.uri] = documentsAnalyzer[this.uri].analyze(documentsAnalyzer, documentsAnalyzerTree);
        }

        const importNode = documentsAnalyzerTree[this.uri];
        if (importNode && importNode.type === "SourceUnit" && importNode?.astNode.loc) {
            this.astNode.loc = importNode.astNode.loc;

            const sourceUintImportNode = importNode as SourceUnitNode;
            const sourceUintExportNodes = sourceUintImportNode.getExportNodes();

            for (let i = 0; i < sourceUintExportNodes.length; i++) {
                if (sourceUintExportNodes[i].uri === this.realURI) {
                    sourceUintExportNodes.splice(i, 1);
                }
            }

            this.setImportNode(sourceUintImportNode);
        }

        const aliesNodes: Node[] = [];
        for (const symbolAliasesIdentifier of this.astNode.symbolAliasesIdentifiers || []) {
            const importedContractNode = find(symbolAliasesIdentifier[0], this.realURI).accept(find, documentsAnalyzer, documentsAnalyzerTree, orphanNodes, this);

            // Check if alias exist for importedContractNode
            if (symbolAliasesIdentifier[1]) {
                const importedContractAliasNode = find(symbolAliasesIdentifier[1], this.realURI).accept(find, documentsAnalyzer, documentsAnalyzerTree, orphanNodes, importedContractNode, this);
                importedContractAliasNode.setAliasName(importedContractNode.getName());

                aliesNodes.push(importedContractAliasNode);
            } else {
                aliesNodes.push(importedContractNode);
            }
        }

        for (const aliesNode of aliesNodes) {
            this.addAliasNode(aliesNode);
        }

        parent?.addChild(this);

        return this;
    }
}
