import React from 'react';
import './App.css';
import * as State from './State';
import { Interaction } from './Interaction';
import { TestResult } from './Check';
import { DefChunks } from './DefChunks';
import { SingleCodeMirrorDefinitions } from './SingleCodeMirrorDefinitions';
import { Menu, Tab } from './Menu';
import { Footer } from './Footer';
import { FontSize } from './FontSize';
import { FSBrowser } from './FSBrowser';
import { Dropdown, DropdownOption } from './Dropdown';
import { Header } from './Header';
import { InteractionError } from './InteractionError';
import * as control from './control';
import SplitterLayout from 'react-splitter-layout';
import 'react-splitter-layout/lib/index.css';

control.installFileSystem();
control.loadBuiltins();

export enum EditorMode {
    Chunks,
    Text,
}

type EditorProps = {
    browseRoot: string;
    browsePath: string[];
    currentFileDirectory: string[];
    currentFileName: string;
};

export class Editor extends React.Component<EditorProps, State.EditorState> {
    constructor(props: EditorProps) {
        super(props);

        control.setupWorkerMessageHandler(
            State.handleLog(this),
            State.handleSetupFinished(this),
            State.handleCompileFailure(this),
            State.handleRuntimeFailure(this),
            State.handleLintFailure(this),
            State.handleLintSuccess(this),
            State.handleCompileSuccess(this),
            State.handleCreateReplSuccess(this),
            State.handleCompileInteractionSuccess(this),
            State.handleCompileInteractionFailure(this));

        this.state = State.makeDefaultEditorState(this.props);
    };

    run = State.handleRun(this)
    update = State.handleUpdate(this)
    onTextEdit = State.handleTextEdit(this)
    onChunkEdit = State.handleChunkEdit(this)
    onTraverseDown = State.handleTraverseDown(this)
    onTraverseUp = State.handleTraverseUp(this)
    onExpandChild = State.handleExpandChild(this)
    setEditorMode = State.handleSetEditorMode(this)
    toggleDropdownVisibility = State.handleToggleDropdownVisibility(this)
    toggleAutoRun = State.handleToggleAutoRun(this)
    toggleStopify = State.handleToggleStopify(this)
    toggleTypeCheck = State.handleToggleTypeCheck(this)
    onDecreaseFontSize = State.handleDecreaseFontSize(this)
    onIncreaseFontSize = State.handleIncreaseFontSize(this)
    onResetFontSize = State.handleResetFontSize(this)
    removeDropdown = State.handleRemoveDropdown(this)
    setMessage = State.handleSetMessage(this)
    stop = State.handleStop(this)

    get isPyretFile() {
        return /\.arr$/.test(this.currentFile);
    }

    get currentFile() {
        return control.bfsSetup.path.join(
            ...this.state.currentFileDirectory,
            this.state.currentFileName);
    }

    get currentFileName() {
        return this.state.currentFileName;
    }

    get currentFileDirectory() {
        return control.bfsSetup.path.join(...this.state.currentFileDirectory);
    }

    get stopify() {
        return this.state.runKind === control.backend.RunKind.Async;
    }

    loadBuiltins = (e: React.MouseEvent<HTMLElement>): void => {
        control.loadBuiltins();
    };

    removeRootDirectory = (e: React.MouseEvent<HTMLElement>): void => {
        control.removeRootDirectory();
    };

    makeHeaderButton = (text: string, enabled: boolean, onClick: () => void) => {
        return (
            <button className={(enabled ? "run-option-enabled" : "run-option-disabled")}
                    onClick={onClick}>
                {text}
            </button>
        );
    };

    makeDefinitions() {
        if (this.state.editorMode === EditorMode.Text) {
            return <SingleCodeMirrorDefinitions
                text={this.state.currentFileContents}
                onEdit={this.onTextEdit}
                highlights={this.state.definitionsHighlights}>
            </SingleCodeMirrorDefinitions>;
        }
        else if (this.state.editorMode === EditorMode.Chunks) {
            return (<DefChunks
                lintFailures={this.state.lintFailures}
                name={this.state.currentFileName}
                highlights={this.state.definitionsHighlights}
                program={this.state.currentFileContents}
                onEdit={this.onChunkEdit}></DefChunks>);
        }
    }

    render() {
        const interactionValues =
            <div style={{ fontSize: this.state.fontSize }}>
                <pre className="checks-area">
                    { this.state.checks && this.state.checks.map(c => <TestResult check={c}></TestResult>)}
                </pre>
                <pre className="interactions-area">
                    {
                        this.state.interactions.map(
                            (i) => {
                                return <Interaction key={i.key}
                                                    name={i.name}
                                                    value={i.value}/>
                            })
                    }
                </pre>
            </div>;

        const dropdown = this.state.dropdownVisible && (
            <Dropdown>
                <DropdownOption enabled={this.state.autoRun}
                                onClick={this.toggleAutoRun}>
                    Auto Run
                </DropdownOption>
                <DropdownOption enabled={this.stopify}
                                onClick={this.toggleStopify}>
                    Stopify
                </DropdownOption>
                <DropdownOption enabled={this.state.typeCheck}
                                onClick={this.toggleTypeCheck}>
                    Type Check
                </DropdownOption>
            </Dropdown>);

        const fsBrowser =
            <FSBrowser root={this.state.browseRoot}
                       onTraverseUp={this.onTraverseUp}
                       onTraverseDown={this.onTraverseDown}
                       onExpandChild={this.onExpandChild}
                       browsePath={this.state.browsePath}
                       key="FSBrowser">
            </FSBrowser>;

        const fontSize =
            <FontSize onIncrease={this.onIncreaseFontSize}
                      onDecrease={this.onDecreaseFontSize}
                      onReset={this.onResetFontSize}
                      size={this.state.fontSize}
                      key="FontSize">
            </FontSize>;

        const textEditor =
            <button className="text-editor"
                    onClick={() => this.setEditorMode(EditorMode.Text)}
                    key="TextEditor">
                Text
            </button>;

        const chunkEditor =
            <button className="chunk-editor"
                    onClick={() => this.setEditorMode(EditorMode.Chunks)}
                    key="ChunkEditor">
                Chunks
            </button>;

        const builtinsLoader =
            <button onClick={control.loadBuiltins}>
                Load Builtins
            </button>;

        const menu =
            <Menu>
                <Tab name="📁">
                    {fsBrowser}
                </Tab>
                <Tab name="⚙">
                    {textEditor}
                    {chunkEditor}
                    {builtinsLoader}
                    {fontSize}
                </Tab>
            </Menu>;

        const rightHandSide =
            <div className="interactions-area-container">
                {this.state.interactionErrors.length > 0 ? (
                    <SplitterLayout vertical={true}
                                    percentage={true}>
                        {interactionValues}
                        <InteractionError fontSize={this.state.fontSize}>
                            {this.state.interactionErrors}
                        </InteractionError>
                    </SplitterLayout>
                ) : interactionValues}
            </div>;

        const definitions = this.makeDefinitions();

        return (
            <div className="page-container">
                <Header>
                    {this.stopify && this.state.compileState === State.CompileState.RunningWithStops ? (
                        <button className="stop-available"
                                onClick={this.stop}>
                            Stop
                        </button>
                    ) : (
                        <button className="stop-unavailable">
                            Stop
                        </button>
                    )}
                    <div className="run-container">
                        <button className="run-ready"
                                onClick={() => this.run(true)}>
                            Run
                        </button>
                        <button className="run-options"
                                onClick={this.toggleDropdownVisibility}
                                onBlur={this.removeDropdown}>&#8628;{dropdown}
                        </button>
                    </div>
                </Header>
                <div className="code-container">
                    {menu}
                    <SplitterLayout vertical={false}
                                    percentage={true}>
                        <div className="edit-area-container"
                             style={{ fontSize: this.state.fontSize }}>
                            {definitions}
                        </div>
                        {rightHandSide}
                    </SplitterLayout>
                </div>
                <Footer message={State.editorStateToString(this)}></Footer>
            </div>
        );
    }
}

