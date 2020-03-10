import React from 'react';
import './App.css';
import { connect, ConnectedProps } from 'react-redux';
import * as State from './State';
import { Interaction } from './Interaction';
import { TestResult } from './Check';
import { DefChunks } from './DefChunks';
import { SingleCodeMirrorDefinitions } from './SingleCodeMirrorDefinitions';
import { Menu, Tab } from './Menu';
import { Footer } from './Footer';
import { FontSize } from './FontSize';
import FSBrowser from './FSBrowser';
import { Dropdown, DropdownOption } from './Dropdown';
import { Header } from './Header';
import { InteractionError } from './InteractionError';
import * as control from './control';
import SplitterLayout from 'react-splitter-layout';
import 'react-splitter-layout/lib/index.css';

type stateProps = {
    browseRoot: string,
    browsePath: string[],
    currentFileDirectory: string[],
    currentFileName: string,
    currentFileContents: string,
    definitionsHighlights: number[][],
    fontSize: number,
    stopify: boolean,
    compileState: State.CompileState,
    checks: any[],
    interactions: { key: any, name: any, value: any }[],
    interactionErrors: any[]
}

function mapStateToProps(state: any): stateProps {
    return {
        browseRoot: state.browseRoot,
        browsePath: state.browsePath,
        currentFileDirectory: state.currentFileDirectory,
        currentFileName: state.currentFileName,
        currentFileContents: state.currentFileContents,
        definitionsHighlights: state.definitionsHighlights,
        fontSize: state.fontSize,
        stopify: state.runKind === control.backend.RunKind.Async,
        compileState: state.compileState,
        checks: state.checks,
        interactions: state.interactions,
        interactionErrors: state.interactionErrors
    };
}

type dispatchProps = {
    beginStartup: () => void,
    queueRun: () => void,
    stop: () => void,
    run: () => void,
    updateContents: (contents: string) => void
}

function mapDispatchToProps(dispatch: any): dispatchProps {
    return {
        beginStartup: () => dispatch({ type: "beginStartup" }),
        queueRun: () => dispatch({ type: "queueRun" }),
        stop: () => dispatch({ type: "stopText" }),
        run: () => dispatch({ type: "runText" }),
        updateContents: (contents: string) => dispatch({ type: "textUpdateContents", contents })
    };
}

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

control.installFileSystem();
control.loadBuiltins();

export enum EditorMode {
    Chunks,
    Text,
}

//type EditorProps = {};

type EditorProps = PropsFromRedux & dispatchProps & stateProps;

export class Editor extends React.Component<EditorProps, any> {
    constructor(props: EditorProps) {
        super(props);

        props.beginStartup();
        props.queueRun();
    };

    //run = State.handleRun(this)
    //update = State.handleUpdate(this)
    //onTextEdit = State.handleTextEdit(this)
    //onChunkEdit = State.handleChunkEdit(this)
    //onTraverseDown = State.handleTraverseDown(this)
    //onTraverseUp = State.handleTraverseUp(this)
    //onExpandChild = State.handleExpandChild(this)
    //setEditorMode = State.handleSetEditorMode(this)
    //toggleDropdownVisibility = State.handleToggleDropdownVisibility(this)
    //toggleAutoRun = State.handleToggleAutoRun(this)
    //toggleStopify = State.handleToggleStopify(this)
    //toggleTypeCheck = State.handleToggleTypeCheck(this)
    //onDecreaseFontSize = State.handleDecreaseFontSize(this)
    //onIncreaseFontSize = State.handleIncreaseFontSize(this)
    //onResetFontSize = State.handleResetFontSize(this)
    //removeDropdown = State.handleRemoveDropdown(this)
    //setMessage = State.handleSetMessage(this)
    //stop = State.handleStop(this)

    //get isPyretFile() {
    //    return /\.arr$/.test(this.currentFile);
    //}

    //get currentFile() {
    //    return control.bfsSetup.path.join(
    //        ...this.state.currentFileDirectory,
    //        this.state.currentFileName);
    //}

    //get currentFileName() {
    //    return this.state.currentFileName;
    //}

    //get currentFileDirectory() {
    //    return control.bfsSetup.path.join(...this.state.currentFileDirectory);
    //}

    //get stopify() {
    //    return this.state.runKind === control.backend.RunKind.Async;
    //}

    //loadBuiltins = (e: React.MouseEvent<HTMLElement>): void => {
    //    control.loadBuiltins();
    //};

    //removeRootDirectory = (e: React.MouseEvent<HTMLElement>): void => {
    //    control.removeRootDirectory();
    //};

    makeHeaderButton = (text: string, enabled: boolean, onClick: () => void) => {
        return (
            <button className={(enabled ? "run-option-enabled" : "run-option-disabled")}
                    onClick={onClick}>
                {text}
            </button>
        );
    };

    makeDefinitions() {
        //if (this.state.editorMode === EditorMode.Text) {
        return (
            <SingleCodeMirrorDefinitions
                text={this.props.currentFileContents}
                onEdit={(contents: string) => this.props.updateContents(contents) }
                highlights={this.props.definitionsHighlights}>
            </SingleCodeMirrorDefinitions>);
        //}
        //else if (this.state.editorMode === EditorMode.Chunks) {
        //    return (<DefChunks
        //        lintFailures={this.state.lintFailures}
        //        name={this.state.currentFileName}
        //        highlights={this.state.definitionsHighlights}
        //        program={this.state.currentFileContents}
        //        onEdit={this.onChunkEdit}></DefChunks>);
        //}
    }

    render() {
        const interactionValues =
            <div style={{ fontSize: this.props.fontSize }}>
                <pre className="checks-area">
                    { this.props.checks && this.props.checks.map((c: any) => <TestResult check={c}></TestResult>)}
                </pre>
                <pre className="interactions-area">
                    {
                        this.props.interactions.map(
                            (i: any) => {
                                return <Interaction key={i.key}
                                                    name={i.name}
                                                    value={i.value}/>
                        })
                    }
                </pre>
            </div>;

        /* const dropdown = this.state.dropdownVisible && (
         *     <Dropdown>
         *         <DropdownOption enabled={this.state.autoRun}
         *                         onClick={this.toggleAutoRun}>
         *             Auto Run
         *         </DropdownOption>
         *         <DropdownOption enabled={this.stopify}
         *                         onClick={this.toggleStopify}>
         *             Stopify
         *         </DropdownOption>
         *         <DropdownOption enabled={this.state.typeCheck}
         *                         onClick={this.toggleTypeCheck}>
         *             Type Check
         *         </DropdownOption>
         *     </Dropdown>);

         * const fsBrowser =
         *     <FSBrowser root={this.state.browseRoot}
         *                onTraverseUp={this.onTraverseUp}
         *                onTraverseDown={this.onTraverseDown}
         *                onExpandChild={this.onExpandChild}
         *                browsePath={this.state.browsePath}
         *                key="FSBrowser">
         *     </FSBrowser>;

         * const fontSize =
         *     <FontSize onIncrease={this.onIncreaseFontSize}
         *               onDecrease={this.onDecreaseFontSize}
         *               onReset={this.onResetFontSize}
         *               size={this.state.fontSize}
         *               key="FontSize">
         *     </FontSize>;

         * const textEditor =
         *     <button className="text-editor"
         *             onClick={() => this.setEditorMode(EditorMode.Text)}
         *             key="TextEditor">
         *         Text
         *     </button>;

         * const chunkEditor =
         *     <button className="chunk-editor"
         *             onClick={() => this.setEditorMode(EditorMode.Chunks)}
         *             key="ChunkEditor">
         *         Chunks
         *     </button>;

         * const builtinsLoader =
         *     <button onClick={control.loadBuiltins}>
         *         Load Builtins
         *     </button>; */

        const menu =
            <Menu>
                <Tab name="📁">
                    {/* {fsBrowser} */}
                    <FSBrowser/>
                </Tab>
                {/* <Tab name="⚙">
                    {textEditor}
                    {chunkEditor}
                    {builtinsLoader}
                    {fontSize}
                    </Tab> */}
            </Menu>;
        const rightHandSide =
            <div className="interactions-area-container">
                {this.props.interactionErrors.length > 0 ? (
                    <SplitterLayout vertical={true}
                                    percentage={true}>
                        {interactionValues}
                        <InteractionError fontSize={this.props.fontSize}>
                            {this.props.interactionErrors}
                        </InteractionError>
                    </SplitterLayout>
                ) : interactionValues}
            </div>;

        const definitions = this.makeDefinitions();

        return (
            <div className="page-container">
                <Header>
                    {this.props.stopify && this.props.compileState === State.CompileState.TextRunningWithStops ? (
                        <button className="stop-available"
                                onClick={this.props.stop}>
                            Stop
                        </button>
                    ) : (
                        <button className="stop-unavailable">
                            Stop
                        </button>
                    )}
                    <div className="run-container">
                        <button className="run-ready"
                                onClick={this.props.run}>
                            Run
                        </button>
                        {/* <button className="run-options"
                            onClick={this.props.toggleDropdownVisibility}
                            onBlur={this.props.removeDropdown}>&#8628;{dropdown}
                            </button> */}
                    </div>
                </Header>
                <div className="code-container">
                    {menu}
                    <SplitterLayout vertical={false}
                                    percentage={true}>
                        <div className="edit-area-container"
                             style={{ fontSize: this.props.fontSize }}>
                            {definitions}
                        </div>
                        {rightHandSide}
                    </SplitterLayout>
                </div>
                {<Footer message={State.compileStateToString(this.props.compileState)}></Footer>}
            </div>
        );
    }
}

export default connector(Editor);
