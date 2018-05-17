// @flow
import React from "react";
import { Alert, Button, ButtonGroup, FormControl, FormGroup, Panel } from "react-bootstrap";
import Session from "../Session";

type Props = { session: Session, history: Object };

type State = {
  text: string,
  error: ?string,
  isLoading: boolean,
  saving: boolean,
  modified: boolean
};

class Edit extends React.Component<Props, State> {
  state: State = {
    text: "",
    error: null,
    modified: false,
    saving: false,
    isLoading: true
  };

  async componentWillMount() {
    await this.load();
  }

  onChange = (e: SyntheticEvent<HTMLTextAreaElement>) => {
    this.setState({
      text: e.currentTarget.value,
      modified: true
    });
  };

  onSave = async () => {
    const { text } = this.state;
    const { session } = this.props;
    this.setState({ modified: false, saving: true });
    try {
      await session.saveText(text);
      this.setState({ saving: false });
    } catch (err) {
      console.error(err);
      this.setState({ error: err.toString(), saving: false });
    }
  };

  onBackClicked = (e: SyntheticEvent<>) => {
    e.preventDefault();
    this.props.history.push('/');
  };

  onShareClicked = async () => {
    await this.onSave();
    this.props.history.push("/share");
  };

  async load() {
    this.setState({ isLoading: true });
    try {
      const text = await this.props.session.loadText();
      this.setState({ text, isLoading: false });
    } catch (e) {
      console.error(e);
      this.setState({ error: e.toString(), isLoading: false });
    }
  }

  render() {
    const { error, isLoading } = this.state;

    return (
      <Panel>
        <Panel.Heading>Your note</Panel.Heading>
        <Panel.Body>
          <form>
            {error && <Alert bsStyle="danger">{error}</Alert>}
            {isLoading && <Alert bsStyle="info">Loading...</Alert>}
            <FormGroup id="edit">
              <FormControl
                componentClass="textarea"
                onChange={this.onChange}
                value={this.state.text}
                rows="12"
              />
            </FormGroup>
            {this.state.modified ? "*" : null}
            <ButtonGroup className="pull-right">
              <Button bsStyle="success" onClick={this.onSave} disabled={this.state.saving}>
                {this.state.saving ? "Saving..." : "Save"}
              </Button>
              <Button bsStyle="primary" onClick={this.onShareClicked}>
                Share
              </Button>
            </ButtonGroup>
          </form>
        </Panel.Body>
        <Panel.Footer>
          <a onClick={this.onBackClicked} href="/">
            &laquo; Back
          </a>
        </Panel.Footer>
      </Panel>
    );
  }
}

export default Edit;
