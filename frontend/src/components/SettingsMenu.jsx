import React from "react";
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Popover from '@material-ui/core/Popover';
import SettingsIcon from '@material-ui/icons/Settings';
import grey from '@material-ui/core/colors/grey';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';

export const SettingsMenu = withStyles((theme) => ({
    settingsButton: {
        backgroundColor: "#b43daf",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        borderRightWidth: 1,
        borderRightStyle: "solid",
        borderRightColor: grey[400],
        padding: "0 2px",
        '&:hover': {
            backgroundColor: "#8c3087",
        }
    },
    settingsIcon: {
        color: theme.palette.common.white,
        fontSize: "1.3em",
    },
    popoverContainer: {
        height: "100%",
    },
    group: {
        margin: theme.spacing.unit,
    },
    formControl: {
        margin: theme.spacing.unit,
    },
    radioRoot: {
        // color: "#b43daf",
    },
    radioChecked: {
        // color: "#b43daf",
    },
}))(({ classes, resolution, onResolutionChange }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  function handleClick(event) {
    setAnchorEl(event.currentTarget);
  }
  function handleClose() {
    setAnchorEl(null);
  }

  const open = Boolean(anchorEl);

  return (
    <div className={classes.popoverContainer}>
      <div onClick={handleClick} className={classes.settingsButton}>
          <SettingsIcon className={classes.settingsIcon}/>
      </div>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <FormControl component="fieldset" className={classes.formControl}>
        <FormLabel component="legend">Quality</FormLabel>
        <RadioGroup
          aria-label="Resolution"
          name="resolution"
          className={classes.group}
          value={resolution}
          onChange={onResolutionChange}
        >
          <FormControlLabel
            value="1440p"
            control={<Radio color="primary"/>}
            label="1440p"
          />
          <FormControlLabel
            value="1080p"
            control={<Radio color="primary"/>}
            label="1080p"
          />
          <FormControlLabel
            value="720p"
            control={<Radio color="primary"/>}
            label="720p"
          />
          <FormControlLabel
            value="480p"
            control={<Radio color="primary"/>}
            label="480p"
          />
        </RadioGroup>
      </FormControl>
      </Popover>
    </div>
  );
});
