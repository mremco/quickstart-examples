import * as React from "react";
import { Panel, Tab, Nav, NavItem } from "react-bootstrap";

import Signin from "./Signin";
import Signup from "./Signup";

const SessionForm = ({ onSignIn, onSignUp }) => (
  <Tab.Container defaultActiveKey="sign-up" id="session_form_container">
    <Panel>
      <Nav bsStyle="tabs" role="tablist" className="nav-justified">
        <NavItem eventKey="sign-up">Sign up</NavItem>
        <NavItem eventKey="sign-in">Sign in</NavItem>
      </Nav>
      <Panel.Body>
        <Tab.Content animation={false}>
          <Tab.Pane eventKey="sign-in">
            <Signin onSubmit={onSignIn} />
          </Tab.Pane>
          <Tab.Pane eventKey="sign-up">
            <Signup onSubmit={onSignUp} />
          </Tab.Pane>
        </Tab.Content>
      </Panel.Body>
    </Panel>
  </Tab.Container>
);

export default SessionForm;
