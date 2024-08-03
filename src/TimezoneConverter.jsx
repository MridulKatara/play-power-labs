

import {
  Box,
  Button,
  Flex,
  Heading,
  Select,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";
import moment from "moment-timezone";
import { useEffect, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt } from "react-icons/fa";
import { IoIosLink, IoIosMoon } from "react-icons/io";
import { LuSunMoon } from "react-icons/lu";
import { MdClose, MdOutlineSwapVert } from "react-icons/md";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const timezonesData = [
  { name: "UTC", offset: 0 },
  { name: "IST", offset: 5.5 },
  { name: "EST", offset: -5 },
  { name: "PST", offset: -8 },
  { name: "CET", offset: 1 },
  { name: "EET", offset: 2 },
  { name: "JST", offset: 9 },
  { name: "AEST", offset: 10 },
  { name: "AKST", offset: -9 },
  { name: "MSK", offset: 3 },
];

const TimezoneConverter = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timezones, setTimezones] = useState([]);
  const [newTimezone, setNewTimezone] = useState("");
  const [sliderValues, setSliderValues] = useState({});

  useEffect(() => {
    const currentUtcMinutes =
      moment().utc().hours() * 60 + moment().utc().minutes();
    const urlParams = new URLSearchParams(window.location.search);
    const savedTimezones = urlParams.get("timezones");
    if (savedTimezones) {
      const parsedTimezones = JSON.parse(savedTimezones);
      const initialSliderValues = {};
      parsedTimezones.forEach((tz) => {
        initialSliderValues[tz.name] = Math.floor(
          moment()
            .utc()
            .startOf("day")
            .add(tz.offset * 60, "minutes")
            .diff(moment().utc().startOf("day"), "minutes") / 15
        );
      });
      setSliderValues(initialSliderValues);
      setTimezones(
        parsedTimezones.map((tz) => ({
          ...tz,
          time: moment()
            .utc()
            .startOf("day")
            .add(currentUtcMinutes + tz.offset * 60, "minutes"),
        }))
      );
    }
  }, []);

  const updateUrl = (newTimezones) => {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set("timezones", JSON.stringify(newTimezones));
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.replaceState(null, "", newUrl);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(timezones);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setTimezones(reordered);
    updateUrl(reordered);
  };

  const handleTimezoneRemoval = (name) => {
    const updatedTimezones = timezones.filter((tz) => tz.name !== name);
    setTimezones(updatedTimezones);
    updateUrl(updatedTimezones);
  };

  const handleTimeUpdate = (value, timezone) => {
    const newTime = moment()
      .utc()
      .startOf("day")
      .add(value * 15, "minutes")
      .add(timezone.offset, "hours");
    const updatedTimezones = timezones.map((tz) => {
      const offsetDiff = tz.offset - timezone.offset;
      const adjustedTime = newTime.clone().subtract(offsetDiff, "hours");
      return tz.name === timezone.name
        ? { ...tz, time: newTime }
        : { ...tz, time: adjustedTime };
    });
    setTimezones(updatedTimezones);
    updateUrl(updatedTimezones);
  };

  const formatTime = (minutes, offset) => {
    const totalMinutes = (minutes + offset * 60 + 1440) % 1440;
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const period = hrs >= 12 ? "PM" : "AM";
    const formattedHours = hrs % 12 === 0 ? 12 : hrs % 12;
    return `${formattedHours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")} ${period}`;
  };

  const addNewTimezone = (name, offset) => {
    const currentUtcMinutes =
      moment().utc().hours() * 60 + moment().utc().minutes();
    const timezone = {
      id: timezones.length + 1,
      name,
      offset,
      time: moment()
        .utc()
        .startOf("day")
        .add(currentUtcMinutes + offset * 60, "minutes"),
    };
    const updatedTimezones = [...timezones, timezone];
    setTimezones(updatedTimezones);
    updateUrl(updatedTimezones);
    setNewTimezone("");
    setSliderValues((prev) => ({
      ...prev,
      [name]: Math.floor(
        moment()
          .utc()
          .startOf("day")
          .add(offset * 60, "minutes")
          .diff(moment().utc().startOf("day"), "minutes") / 15
      ),
    }));
  };

  const handleSelect = (event, timezone) => {
    const [time, period] = event.target.value.split(" ");
    const [hours, minutes] = time.split(":").map(Number);
    let newHours = hours % 12;
    if (period === "PM") newHours += 12;
    const totalMinutes = newHours * 60 + minutes;
    const utcMinutes = (totalMinutes - timezone.offset * 60 + 1440) % 1440;
    handleTimeUpdate(Math.floor(utcMinutes / 15), timezone);
  };

  const generateTimeOptions = (timezone) => {
    const options = [];
    for (let i = 0; i < 1440; i += 15) {
      const timeString = formatTime(i, timezone.offset);
      options.push(
        <option key={i} value={timeString}>
          {timeString}
        </option>
      );
    }
    return options;
  };

  const copyCurrentLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const labels = [];
  for (let i = 0; i <= 1440; i += 180) {
    const hour = (i / 60) % 24;
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    labels.push(`${formattedHour.toString().padStart(2, "0")}:00 ${period}`);
  }

  const reverseTimezones = () => {
    const reversed = [...timezones].reverse();
    setTimezones(reversed);
    updateUrl(reversed);
  };

  const scheduleGoogleMeet = () => {
    const userTime = selectedDate;
    userTime.setHours(userTime.getHours() + 10);
    userTime.setMinutes(userTime.getMinutes() + 55);

    const offsetMillis = userTime.getTimezoneOffset() * 60 * 1000;
    const utcTime = new Date(userTime.getTime() + offsetMillis);
    const endTime = new Date(utcTime.getTime() + 2 * 60 * 60 * 1000);

    const startTimeISO = utcTime
      .toISOString()
      .replace(/[:\-.]/g, "")
      .slice(0, -5);
    const endTimeISO = endTime
      .toISOString()
      .replace(/[:\-.]/g, "")
      .slice(0, -5);

    const offsetHours = Math.abs(Math.floor(userTime.getTimezoneOffset() / 60))
      .toString()
      .padStart(2, "0");
    const offsetMinutes = Math.abs(userTime.getTimezoneOffset() % 60)
      .toString()
      .padStart(2, "0");
    const offsetSign = userTime.getTimezoneOffset() < 0 ? "+" : "-";
    const formattedOffset = `${offsetSign}${offsetHours}${offsetMinutes}`;

    const calendarURL = `https://calendar.google.com/calendar/u/0/r/eventedit?text=Schedule+Meet&dates=${startTimeISO}/${endTimeISO}&ctz=${formattedOffset}&details=Meeting+details&location=Online`;
    window.open(calendarURL, "_blank");
  };

  return (
    <>
      <Heading
        textAlign="center"
        mt={8}
        color={useColorModeValue("teal.600", "teal.300")}
      >
        Timezone Converter
      </Heading>
      <Box
        ml={12}
        mr={12}
        mt={4}
        p={4}
        borderWidth="2px"
        borderRadius="lg"
        borderColor={useColorModeValue("teal.500", "teal.200")}
      >
        <Flex justifyContent="space-between" alignItems="center" wrap="wrap">
          <Select
            w="250px"
            value={newTimezone}
            onChange={(e) => setNewTimezone(e.target.value)}
            placeholder="Select timezone to add"
            mb={4}
          >
            {timezonesData.map((tz) => (
              <option key={tz.name} value={tz.name}>
                {tz.name}
              </option>
            ))}
          </Select>
          <Button
            colorScheme="teal"
            onClick={() => {
              const selected = timezonesData.find(
                (tz) => tz.name === newTimezone
              );
              if (selected) addNewTimezone(selected.name, selected.offset);
            }}
            mb={4}
          >
            Add Timezone
          </Button>
          <Button
            colorScheme="teal"
            onClick={reverseTimezones}
            mb={4}
            leftIcon={<MdOutlineSwapVert />}
          >
            Reverse Timezones
          </Button>
          <Button
            colorScheme="teal"
            onClick={copyCurrentLink}
            mb={4}
            leftIcon={<IoIosLink />}
          >
            Copy Link
          </Button>
          <Button
            colorScheme="teal"
            onClick={scheduleGoogleMeet}
            mb={4}
            leftIcon={<FaCalendarAlt />}
          >
            Schedule Meet
          </Button>
          <Button
            colorScheme="teal"
            onClick={toggleColorMode}
            mb={4}
            leftIcon={colorMode === "light" ? <IoIosMoon /> : <LuSunMoon />}
          >
            Toggle {colorMode === "light" ? "Dark" : "Light"} Mode
          </Button>
        </Flex>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="droppable">
            {(provided) => (
              <Flex
                flexDirection="column"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {timezones.map((timezone, index) => (
                  <Draggable
                    key={timezone.name}
                    draggableId={timezone.name}
                    index={index}
                  >
                    {(provided) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        borderWidth="1px"
                        borderRadius="md"
                        p={4}
                        mb={2}
                        bg={useColorModeValue("white", "gray.700")}
                        shadow="md"
                      >
                        <Flex
                          justifyContent="space-between"
                          alignItems="center"
                          mb={2}
                        >
                          <Heading size="md">{timezone.name}</Heading>
                          <Button
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleTimezoneRemoval(timezone.name)}
                            leftIcon={<MdClose />}
                          >
                            Remove
                          </Button>
                        </Flex>
                        <Text>
                          Current Time: {timezone.time.format("HH:mm:ss")}
                        </Text>
                        <Slider
                          value={sliderValues[timezone.name] || 0}
                          min={0}
                          max={96}
                          step={1}
                          onChange={(value) => {
                            setSliderValues((prev) => ({
                              ...prev,
                              [timezone.name]: value,
                            }));
                            handleTimeUpdate(value, timezone);
                          }}
                        >
                          <SliderTrack>
                            <SliderFilledTrack />
                          </SliderTrack>
                          <SliderThumb />
                        </Slider>
                        <Select
                          mt={2}
                          onChange={(event) => handleSelect(event, timezone)}
                        >
                          {generateTimeOptions(timezone)}
                        </Select>
                      </Box>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Flex>
            )}
          </Droppable>
        </DragDropContext>
        <ToastContainer />
      </Box>
    </>
  );
};

export default TimezoneConverter;
