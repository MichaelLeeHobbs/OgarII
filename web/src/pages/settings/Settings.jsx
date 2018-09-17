import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Icon from '@material-ui/core/Icon';
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import { Settings } from '../../modules/Settings'

const CustomTableCell = withStyles(theme => ({
    head: {
        backgroundColor: theme.palette.common.black,
        color: theme.palette.common.white,
    },
    body: {
        fontSize: 14,
    },
}))(TableCell);

const styles = theme => ({
    root: {
        width: '100%',
        marginTop: theme.spacing.unit * 3,
        overflowX: 'auto',
    },
    table: {
        minWidth: 700,
    },
    row: {
        '&:nth-of-type(odd)': {
            backgroundColor: theme.palette.background.default,
        },
    },
});

class SettingsComp extends React.Component {
    constructor(props) {
        super(props)
        this.settings = new Settings(this.props.token)
        this.settings.on('initialized', (settings) => this.setState({settings: settings}))
        this.settings.on('update', ({key, value}) => this.setState({settings: this.state.settings.set(key, value)}))

        this.state = {
            settings: [],
            editing: [],
        }
    }

    RowButton = (props) => {
        let {id, classes} = props

        return (this.state.editing[id] ? <Button variant="fab"
                                                 color="secondary"
                                                 aria-label="Edit"
                                                 className={classes.button}
                                                 onClick={() => {
                                                     let editing = this.state.editing
                                                     editing[id] = false
                                                     this.setState({editing})
                                                 }}
        >
            <Icon>save_icon</Icon>
        </Button> : <Button variant="fab"
                            color="secondary"
                            aria-label="Edit"
                            className={classes.button}
                            onClick={() => {
                                let editing = this.state.editing
                                editing[id] = true
                                this.setState({editing})
                            }}>
            <Icon>edit_icon</Icon>
        </Button>)
    }

    RowValue = (props) => {
        let {id, value, classes} = props

        return (this.state.editing[id] ? <TextField
            id="name"
            className={classes.textField}
            value={value}
            onChange={(event)=>this.settings.set(id, event.target.value)}
            margin="normal"
        /> : <div>{value}</div>)
    }


    render() {
        const {classes} = this.props
        return (
            <Paper className={classes.root}>
                <Button variant="fab"
                        color="secondary"
                        aria-label="Reset Server"
                        className={classes.button}
                        onClick={() => {
                            fetch('/api/servers?id=1&command=restart', {method: 'PUT'})
                        }}
                >Reset Server</Button>
                <Table className={classes.table}>
                    <TableHead>
                        <TableRow>
                            <CustomTableCell>Key</CustomTableCell>
                            <CustomTableCell>Value</CustomTableCell>
                            <CustomTableCell>Edit</CustomTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {this.state.settings.map((data, id) => {
                            if (!data) return
                            if (typeof data.value !== "string") {
                                data.value = JSON.stringify(data.value)
                            }
                            let {RowButton, RowValue} = this
                            //let RowButton = this.generateRowButton(row.id, classes)

                            return (
                                <TableRow className={classes.row} key={id}>
                                    <CustomTableCell component="th" scope="row">{data.key}</CustomTableCell>
                                    <CustomTableCell><RowValue id={id} value={data.value}
                                                               classes={classes}/></CustomTableCell>
                                    <CustomTableCell><RowButton id={id} classes={classes}/></CustomTableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </Paper>
        )
    }
}

SettingsComp.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(SettingsComp)
