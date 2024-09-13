import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import 'chart.js/auto';
import './Home.css';


//Icons

import cloudyIcon from '../assets/icons/cloudy.png';
import cloudyRainIcon from '../assets/icons/cloudy1.png';
import snowyIcon from '../assets/icons/snowy.png';
import stormIcon from '../assets/icons/storm.png';
import sunIcon from '../assets/icons/sun.png';
import windIcon from '../assets/icons/wind.png';


const geocodingApiKey = 'b48e01506af949a5bc1f774567a9a6c5'; 

const Home = () => {
    const [location, setLocation] = useState('London');
    const [inputValue, setInputValue] = useState('');
    const [currentWeather, setCurrentWeather] = useState(null);
    const [hourlyForecast, setHourlyForecast] = useState([]);
    const [dailyForecast, setDailyForecast] = useState([]);
    const [sunrise, setSunrise] = useState(null);
    const [sunset, setSunset] = useState(null);

    const fetchWeather = async (latitude, longitude) => {
        try {
            const response = await axios.get(`https://api.open-meteo.com/v1/forecast`, {
                params: {
                    latitude: latitude,
                    longitude: longitude,
                    hourly: 'temperature_2m,weathercode,windspeed_10m',
                    daily: 'temperature_2m_max,temperature_2m_min,weathercode,windspeed_10m_max',
                    current_weather: true,
                    timezone: 'auto',
                },
            });

            setCurrentWeather(response.data.current_weather);
            setHourlyForecast(response.data.hourly);
            setDailyForecast(response.data.daily);
            const sunriseTime = new Date(response.data.daily.sunrise[0]);
            const sunsetTime = new Date(response.data.daily.sunset[0]);
            setSunrise(sunriseTime);
            setSunset(sunsetTime);
        } catch (error) {
            console.error('Error fetching the weather data', error);
        }
    };

    const geocodeLocation = async (locationName) => {
        try {
            const response = await axios.get(`https://api.opencagedata.com/geocode/v1/json`, {
                params: {
                    q: locationName,
                    key: geocodingApiKey,
                },
            });

            if (response.data.results.length > 0) {
                const { lat, lng } = response.data.results[0].geometry;
                fetchWeather(lat, lng);
            } else {
                console.error('Location not found');
            }
        } catch (error) {
            console.error('Error fetching geocoding data', error);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setLocation(inputValue);
        geocodeLocation(inputValue);
    };


    const currentHour = new Date().getHours();
    const currentDate = new Date();


    const isDayTime = sunrise && sunset && (currentDate >= sunrise && currentDate <= sunset);

    const temperatureData = {
        labels: hourlyForecast.time
            ? hourlyForecast.time.slice(0, 24).map((time) => {
                  const date = new Date(time);
                  return `${date.getHours()}:00`;
              })
            : [],
        datasets: [
            {
                label: 'Temperature (°C)',
                data: hourlyForecast.temperature_2m ? hourlyForecast.temperature_2m.slice(0, 24) : [],
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.4, 
            },
        ],
    };


    const options = {
        scales: {
            x: {
                type: 'category',
                ticks: {
                    autoSkip: true,
                    maxTicksLimit: 24,
                },
            },
            y: {
                beginAtZero: true,
            },
        },
        plugins: {
            annotation: {
                annotations: {
                    line1: {
                        type: 'line',
                        xMin: `${currentHour}:00`,
                        xMax: `${currentHour}:00`,
                        borderColor: 'red',
                        borderWidth: 2,
                        label: {
                            content: 'Current Time',
                            enabled: true,
                            position: 'top',
                        },
                    },
                },
            },
            background: {
                beforeDraw: (chart) => {
                    const ctx = chart.ctx;
                    const canvas = chart.canvas;
                    const chartArea = chart.chartArea;

                    ctx.save();
                    ctx.fillStyle = isDayTime ? 'white' : '#333';
                    ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
                    ctx.restore();
                },
            },
        },
    };
    const getWeatherIcon = (weatherCode) => {
        switch (weatherCode) {
            case 0:
                return <img src={sunIcon} alt="Sunny" />;
            case 1:
            case 2:
            case 3:
                return <img src={cloudyIcon} alt="Cloudy" />;
            case 45:
            case 48:
                return <img src={windIcon} alt="Windy" />;
            case 51:
            case 53:
            case 55:
            case 61:
            case 63:
            case 65:
                return <img src={cloudyRainIcon} alt="Rainy" />;
            case 71:
            case 73:
            case 75:
            case 85:
            case 86:
                return <img src={snowyIcon} alt="Snowy" />;
            case 95:
            case 96:
            case 99:
                return <img src={stormIcon} alt="Stormy" />;
            default://return code if not found
                return <p>{weatherCode}--</p>;
        }
    };
    

    const renderHourlyCarousel = () => {
        if (!hourlyForecast || !hourlyForecast.time || !hourlyForecast.weathercode || !hourlyForecast.windspeed_10m) {
            return <p>Loading...</p>; // Handle case where data is not yet available
        }
    
        return (
            <Carousel
                showThumbs={false}
                showStatus={false}
                infiniteLoop={false}
                emulateTouch={true}
                selectedItem={currentHour}
                centerMode={true}
                centerSlidePercentage={100 / 8}
                swipeable={true}
                dynamicHeight={true}
            >
                {hourlyForecast.time &&
                    hourlyForecast.time.slice(0, 24).map((time, index) => {
                        const isCurrent = new Date(time).getHours() === currentHour;
        
                        const weatherCode = hourlyForecast.weathercode ? hourlyForecast.weathercode[index] : null;
                        const windSpeed = hourlyForecast.windspeed_10m ? hourlyForecast.windspeed_10m[index] : null;
        
                        return (
                            <div
                                key={index}
                                className={`carousel-item ${isCurrent ? 'current-hour' : ''}`}
                                style={{
                                    backgroundColor: isCurrent ? '#ccc' : 'white',
                                    padding: '10px',
                                    textAlign: 'center',
                                    borderRadius: '8px',
                                }}
                            >
                                <p>{new Date(time).getHours()}:00</p>
                                <div className="weather-icon">
                                    {weatherCode ? getWeatherIcon(weatherCode) : '-'}
                                </div>
                                <p>Wind: {windSpeed ? `${windSpeed} km/h` : 'N/A'}</p>
                            </div>
                        );
                    })}
            </Carousel>
        );
        
    };
    
    
    

    return (
        <div className="home-container">
            <div className="navbar">WeatherApp</div>
            <div className="weather-display">
                {currentWeather ? (
                    <div className="weather-card">
                        <div className="current-weather">
                            <h2>Current Weather in {location}</h2>
                            <div className="weather-icon">{getWeatherIcon(currentWeather.weathercode)}</div>
                            <p>Temperature: {currentWeather.temperature}°C</p>
                            <p>Wind Speed: {currentWeather.windspeed} km/h</p>
                        </div>

                        <div className="hourly-forecast">
                            <h3>Temperature in the Next 24 Hours</h3>
                            <div
                                style={{
                                    height: '30vh',
                                    maxHeight: '30vh',
                                    maxWidth: '80%',
                                    margin: '0 auto',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <Line data={temperatureData} options={options} />
                            </div>

                            <h3>Weather Conditions in the Next 24 Hours</h3>
                            {renderHourlyCarousel()}
                        </div>

                        <div className="daily-forecast">
                            <h3>Next 3 Days</h3>
                            <div className="forecast-grid center-content">
                                {dailyForecast.time &&
                                    dailyForecast.time.slice(0, 3).map((date, index) => (
                                        <div key={index} className="forecast-item">
                                            <p>{new Date(date).toLocaleDateString()}</p>
                                            <div className="weather-icon">{getWeatherIcon(dailyForecast.weathercode[index])}</div>
                                            <p>Max: {dailyForecast.temperature_2m_max[index]}°C</p>
                                            <p>Min: {dailyForecast.temperature_2m_min[index]}°C</p>
                                            <p>Wind: {dailyForecast.windspeed_10m_max[index]} km/h</p>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <p>No data available. Please enter a location and submit.</p>
                )}
            </div>
            <div className="input-container">
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Enter location (e.g., London)"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                    <button type="submit">Get Weather</button>
                </form>
            </div>
        </div>
    );
};

export default Home;

