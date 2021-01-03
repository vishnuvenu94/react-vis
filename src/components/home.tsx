import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { makeStyles } from '@material-ui/core/styles';

import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import 'date-fns';
import DateFnsUtils from '@date-io/date-fns';
import CircularProgress from '@material-ui/core/CircularProgress';

import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker,
} from '@material-ui/pickers';

import {
  XYPlot,
  XAxis,
  YAxis,
  HorizontalGridLines,
  VerticalGridLines,
  LineSeries,
} from 'react-vis';
import '../../node_modules/react-vis/dist/style.css';

import Grid from '@material-ui/core/Grid';

const useStyles = makeStyles((theme) => ({
  option: {
    fontSize: 15,
    '& > span': {
      marginRight: 10,
      fontSize: 18,
    },
  },
  root: {
    flexGrow: 1,
    marginTop: '30px',
  },
}));

function Home() {
  const classes = useStyles();
  const [countries, setCountries] = useState<any>([]);
  const [country, setCountry] = useState<any>({});
  const [cities, setCities] = useState([]);
  const [city, setCity] = useState<any>({});

  const [pollutionData, setPollutionData] = useState<any>({});
  const [showChart, setShowChart] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNotFound, setShowNotFound] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  const handleDateChange = async (date: Date | null) => {
    if (date) {
      setShowSpinner(true);
      setShowChart(false);
      setShowNotFound(false);

      console.dir(date);
      let toDateObject = new Date(date.getTime());
      toDateObject.setHours(toDateObject.getHours() + 24);

      const fromDate = getDate(date);
      const toDate = getDate(toDateObject);

      setSelectedDate(date);
      console.log(date.getTime());
      if (country && city) {
        try {
          const result = await axios(
            `https://api.openaq.org/v1/measurements?country=${country.code}&city=${city.name}&date_from=${fromDate}&date_to=${toDate}`
          );
          setShowSpinner(false);
          setShowChart(true);

          if (result.data.results.length == 0) {
            setShowNotFound(true);
          } else {
            setShowNotFound(false);
          }
          const seperatedByParameters = seperateByParameters(
            result.data.results
          );
          setShowChart(true);
          setPollutionData(seperatedByParameters);
        } catch (err) {
          setShowSpinner(false);

          alert('Oops something went wrong, Please refresh and try again!!');
        }
      }
    }
  };
  const getDate = (dateObject: Date): string => {
    const dd = String(dateObject.getDate()).padStart(2, '0');
    const mm = String(dateObject.getMonth() + 1).padStart(2, '0'); //January is 0!
    const yyyy = dateObject.getFullYear();

    const date = yyyy + '-' + mm + '-' + dd;
    return date;
  };
  useEffect(() => {
    const cachedCountries = localStorage.getItem('countries');
    setShowSpinner(true);
    setShowNotFound(false);

    if (cachedCountries) {
      const cacheParsed = JSON.parse(cachedCountries);
      setShowSpinner(false);

      setCountries(cacheParsed);
    }

    axios('https://api.openaq.org/v1/countries')
      .then(({ data }) => {
        setShowSpinner(false);

        console.log(data.results);
        const countryData = data.results;
        const validCountries = countryData.filter(
          (country: any) => country.name
        );
        console.log(validCountries);
        localStorage.setItem('countries', JSON.stringify(validCountries));

        setCountries(validCountries);
      })
      .catch((err) => {
        setShowSpinner(false);

        alert('Oops something went wrong, Please refresh and try again!!');
      });
  }, []);

  useEffect(() => {}, [showSpinner, showNotFound]);

  async function countrySelected(country: any) {
    if (country) {
      setCountry(country);
      setShowSpinner(true);
      setShowChart(false);
      setShowNotFound(false);
      setSelectedDate(new Date());

      try {
        const result = await axios(
          `https://api.openaq.org/v1/cities?country=${country.code}`
        );
        setShowSpinner(false);

        console.log(result);
        setCities(result.data.results);
      } catch (err) {
        setShowSpinner(false);

        alert('Oops something went wrong, Please refresh and try again!!');
      }
    }
  }

  async function citySelected(city: any) {
    if (city) {
      const today = getDate(new Date());
      setShowSpinner(true);
      setShowChart(false);
      setShowNotFound(false);
      setSelectedDate(new Date());

      setCity(city);
      try {
        const result = await axios(
          `https://api.openaq.org/v1/measurements?country=${country.code}&city=${city.name}&date_from=${today}`
        );
        setShowSpinner(false);
        setShowChart(true);

        if (result.data.results.length == 0) {
          setShowNotFound(true);
        } else {
          setShowNotFound(false);
        }

        const seperatedByParameters = seperateByParameters(result.data.results);
        setShowChart(true);
        setPollutionData(seperatedByParameters);
      } catch (err) {
        setShowSpinner(false);

        alert('Oops something went wrong, Please refresh and try again!!');
      }
    }
  }

  function seperateByParameters(measurements: any) {
    const seperatedByParameters: any = {};
    measurements.forEach((measurement: any) => {
      seperatedByParameters[measurement.parameter] = seperatedByParameters[
        measurement.parameter
      ]
        ? [...seperatedByParameters[measurement.parameter], measurement]
        : [measurement];
    });
    console.log(seperatedByParameters);
    return seperatedByParameters;
  }

  return (
    <div className={classes.root}>
      <p style={{ fontSize: '40px', textAlign: 'center' }}>Pollution Data</p>
      <Grid container spacing={3} justify='center'>
        {countries && countries.length > 0 && (
          <Grid item>
            <Autocomplete
              id='country-select-demo'
              style={{ width: 300 }}
              options={countries}
              onChange={(event, value) => countrySelected(value)}
              classes={{
                option: classes.option,
              }}
              autoHighlight
              getOptionLabel={(option: any) => option.name}
              renderOption={(option) => (
                <React.Fragment>{option.name}</React.Fragment>
              )}
              renderInput={(params: any) => {
                const inputProps = params.inputProps;
                inputProps.autoComplete = 'off';
                return (
                  <TextField
                    {...params}
                    label='Choose a country'
                    variant='outlined'
                    inputProps={{
                      ...params.inputProps,
                      autoComplete: 'off', // disable autocomplete and autofill
                    }}
                  />
                );
              }}
            />
          </Grid>
        )}
        {cities.length > 0 && (
          <Grid item>
            <Autocomplete
              id='city-select-demo'
              style={{ width: 300 }}
              options={cities}
              onChange={(event, value) => citySelected(value)}
              classes={{
                option: classes.option,
              }}
              autoHighlight
              getOptionLabel={(option: any) => option.name}
              renderOption={(option) => (
                <React.Fragment>
                  {/* <span>{countryToFlag(option.code)}</span> */}
                  {option.name}
                </React.Fragment>
              )}
              renderInput={(params) => (
                <TextField
                  autoComplete='off'
                  {...params}
                  label='Choose a city'
                  variant='outlined'
                  inputProps={{
                    ...params.inputProps,
                    autoComplete: 'off', // disable autocomplete and autofill
                  }}
                />
              )}
            />
          </Grid>
        )}

        {showChart && (
          <Grid item container justify='flex-end'>
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <KeyboardDatePicker
                margin='normal'
                id='date-picker-dialog'
                label='Date picker dialog'
                format='MM/dd/yyyy'
                value={selectedDate}
                onChange={handleDateChange}
                KeyboardButtonProps={{
                  'aria-label': 'change date',
                }}
              />
            </MuiPickersUtilsProvider>
          </Grid>
        )}
      </Grid>
      <Grid container justify='center'>
        {showChart &&
          Object.keys(pollutionData).map((parameter: any) => {
            let validData: any[] = [];
            let times: any = {};
            pollutionData[parameter].forEach((data: any) => {
              const time = new Date(data.date.utc).getTime();
              if (!times[time]) {
                let obj: any = {};
                obj.x = new Date(data.date.utc).getTime();
                obj.y = data.value;
                validData.push(obj);
              }
              times[time] = time;
            });
            return (
              <div key={parameter}>
                <p>{pollutionData[parameter][0].parameter} Levels </p>
                <XYPlot xType='time' width={1300} height={300}>
                  <HorizontalGridLines />
                  <VerticalGridLines />
                  <XAxis title='Time' />
                  <YAxis title={pollutionData[parameter][0].unit} />
                  <LineSeries data={validData} />
                </XYPlot>
              </div>
            );
          })}
        {showNotFound && <p>Didn't get data for this date. Try another</p>}
        {showSpinner && (
          <CircularProgress style={{ marginTop: '30px' }}></CircularProgress>
        )}
      </Grid>
    </div>
  );
}

export default Home;
