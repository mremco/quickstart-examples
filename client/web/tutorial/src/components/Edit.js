import React from "react";
import { Alert, Button, ButtonGroup, FormControl, FormGroup, Panel } from "react-bootstrap";

class Edit extends React.Component {
  state = {
    text: "",
    error: null,
    modified: false,
    isSaving: false,
    isLoading: true,
    isLoaded: false,
    isDeleting: false,
  };

  async componentWillMount() {
    await this.load();
  }

  onChange = e => {
    this.setState({
      text: e.currentTarget.value,
      modified: true,
    });
  };

  onSave = async () => {
    const { text } = this.state;
    const { session } = this.props;
    this.setState({ modified: false, isSaving: true });
    try {
      await session.saveText(text);
      this.setState({ isSaving: false });
    } catch (err) {
      console.error(err);
      this.setState({ error: err.toString(), isSaving: false });
    }
  };

  onBackClicked = e => {
    e.preventDefault();
    this.props.history.push("/");
  };

  onDeleteClicked = async e => {
    this.setState({ isDeleting: true });
    const { session } = this.props;

    e.preventDefault();
    try {
      await session.delete();
      this.setState({ isDeleting: false, text: "" });
    } catch (err) {
      console.error(err);
      this.setState({ error: err.toString(), isDeleting: false });
    }
  };

  onShareClicked = async () => {
    await this.onSave();
    this.props.history.push("/share");
  };

  async load() {
    const { session } = this.props;
    const { userId } = session;
    this.setState({ isLoading: true });
    try {
      const text = await session.loadTextFromUser(userId);
      this.setState({ text, isLoading: false, isLoaded: true });
    } catch (e) {
      console.error(e);
      this.setState({ error: e.toString(), isLoading: false, isLoaded: true });
    }
  }

  render() {
    const { error, isLoading, isLoaded, isSaving, isDeleting } = this.state;

    return (
      <Panel>
        <Panel.Heading id="your-note-heading">My note</Panel.Heading>
        <Panel.Body>
          <form>
            {error && (
              <Alert id="edit-error" bsStyle="danger">
                {error}
              </Alert>
            )}
            {/* {isLoading && (
              <Alert id="edit-loading" bsStyle="info">
                Loading...
              </Alert>
            )} */}
            <FormGroup id="edit">
              <FormControl
                id="edit-textarea"
                componentClass="textarea"
                onChange={this.onChange}
                value={isLoading ? "Loading..." : this.state.text}
                rows="12"
                disabled={isLoading}
              />
            </FormGroup>
            {this.state.modified ? "*" : null}
            <ButtonGroup className="pull-right">
              <Button id="delete-button" bsStyle="danger" onClick={this.onDeleteClicked}>
                {isDeleting ? "Deleting ..." : "Delete"}
              </Button>
              <Button
                id="save-button"
                bsStyle="success"
                onClick={this.onSave}
                disabled={isSaving || !isLoaded}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button
                id="go-to-share-button"
                bsStyle="primary"
                onClick={this.onShareClicked}
                disabled={!isLoaded}
              >
                Share
              </Button>
            </ButtonGroup>
          </form>
        </Panel.Body>
        <Panel.Footer>
          <a id="back-link" onClick={this.onBackClicked} href="/">
            &laquo; Back
          </a>
        </Panel.Footer>
      </Panel>
    );
  }
}

export default Edit;
