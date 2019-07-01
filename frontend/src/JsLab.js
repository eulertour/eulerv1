import React from "react";
import { withStyles } from "@material-ui/core/styles";

const styles = theme => ({
  content: {
    display: "flex",
    justifyContent: "space-around",
    width: "100%",
  },
  console: {
    border: "1px solid black",
    height: "100px",
    marginRight: "30px",
    flex: "1",
  },
  shell: {
    border: "1px solid black",
    height: "100px",
    flex: "1",
  },
});

const pyodide = window.pyodide;

class JsLab extends React.Component {
  state = {
    pyInput: "",
    pyOutput: "",
  };

  componentDidMount() {
    window.languagePluginLoader.then(() => {
      console.log(pyodide.runPython("import sys\nsys.version"));
      pyodide.loadPackage("numpy").then(() => {
        console.log(pyodide.runPython("import numpy\nnumpy.version.version"));
      });
    });
  }

  render() {
    const { classes } = this.props;
    return (
      <div>
        <div className={classes.content}>
          <div className={classes.console}>{this.state.pyOutput}</div>
          <textarea
            className={classes.shell}
            value={this.state.pyInput}
            onChange={event => {
              this.setState({ pyInput: event.target.value });
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            this.setState({ pyOutput: pyodide.runPython(this.state.pyInput) });
          }}
        >
          Run Python
        </button>
      </div>
    );
  }
}

export default withStyles(styles, { withTheme: true })(JsLab);
