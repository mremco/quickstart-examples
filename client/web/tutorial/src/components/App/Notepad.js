import React from "react";
import { Switch, Route } from "react-router";

import Home from "../Home";
import ViewNote from "../ViewNote";
import Share from "../Share";
import Edit from "../Edit";

const Content = ({ session }) => (
  <Switch>
    <Route path="/view/:friendId" render={props => <ViewNote session={session} {...props} />} />
    <Route path="/edit" render={props => <Edit session={session} {...props} />} />
    <Route path="/share" render={props => <Share session={session} {...props} />} />
    <Route path="/" render={props => <Home session={session} {...props} />} />
  </Switch>
);

export default Content;
