-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Хост: 127.0.0.1:3306
-- Время создания: Июн 09 2026 г., 11:44
-- Версия сервера: 8.0.30
-- Версия PHP: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `erpdbNew`
--

-- --------------------------------------------------------

--
-- Структура таблицы `CRG`
--

CREATE TABLE `CRG` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(20) NOT NULL,
  `child` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Дамп данных таблицы `CRG`
--

INSERT INTO `CRG` (`id`, `name`, `code`, `child`) VALUES
(1, 'Инвалиды с преимущественными нарушениями психических функций', 'ЦРГ 1', 0),
(2, 'Инвалиды с преимущественными нарушениями языковых и речевых функций', 'ЦРГ 2', 0),
(3, 'Инвалиды с преимущественными нарушениями сенсорных функций', 'ЦРГ 3', 0),
(4, 'Инвалиды с преимущественными нарушениями нейромышечных, скелетных и связанных с движением (статодинамических) функций', 'ЦРГ 4', 0),
(5, 'Инвалиды с преимущественными нарушениями функций сердечно-сосудистой и (или) дыхательной системы (систем)', 'ЦРГ 5', 0),
(6, 'Инвалиды с преимущественными нарушениями функций пищеварительной и (или) эндокринной системы (систем) и метаболизма', 'ЦРГ 6', 0),
(7, 'Инвалиды с преимущественными нарушениями функций системы крови и иммунной системы, в том числе вследствие злокачественных новообразований, а также отдельных инфекционных заболеваний', 'ЦРГ 7', 0),
(8, 'Инвалиды с преимущественными нарушениями мочевыделительной функции', 'ЦРГ 8', 0),
(9, 'Инвалиды с преимущественными нарушениями функций кожи и связанных с ней систем', 'ЦРГ 9', 0),
(10, 'Инвалиды со сложными и (или) множественными нарушениями функций организма, обусловленными хромосомными и генными болезнями', 'ЦРГ 10', 0),
(11, 'Инвалиды с врожденными или приобретенными деформациями (аномалиями развития), последствиями травм лица', 'ЦРГ 11', 0),
(12, 'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях', 'ЦРГ 12', 0),
(13, 'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями', 'ЦРГ 13', 0),
(14, 'Ребенок-инвалид с преимущественными нарушениями психических функций', 'ЦРГ 1', 1),
(15, 'Ребенок-инвалид с преимущественными нарушениями языковых и речевых функций', 'ЦРГ 2', 1),
(16, 'Ребенок-инвалид с преимущественными нарушениями сенсорных функций', 'ЦРГ 3', 1),
(17, 'Ребенок-инвалид с преимущественными нарушениями нейромышечных, скелетных и связанных с движением (статодинамических) функций', 'ЦРГ 4', 1),
(18, 'Ребенок-инвалид с преимущественными нарушениями функций сердечно-сосудистой и (или) дыхательной системы (систем)', 'ЦРГ 5', 1),
(19, 'Ребенок-инвалид с преимущественными нарушениями функций пищеварительной и (или) эндокринной системы (систем) и метаболизма', 'ЦРГ 6', 1),
(20, 'Ребенок-инвалид с преимущественными нарушениями функций системы крови и иммунной системы, в том числе вследствие злокачественных новообразований, а также отдельных инфекционных заболеваний', 'ЦРГ 7', 1),
(21, 'Ребенок-инвалид с преимущественными нарушениями мочевыделительной функции', 'ЦРГ 8', 1),
(22, 'Ребенок-инвалид с преимущественными нарушениями функций кожи и связанных с ней систем', 'ЦРГ 9', 1),
(23, 'Ребенок-инвалид со сложными и (или) множественными нарушениями функций организма, обусловленными хромосомными и генными болезнями', 'ЦРГ 10', 1),
(24, 'Ребенок-инвалид с врожденными или приобретенными деформациями (аномалиями развития), последствиями травм лица', 'ЦРГ 11', 1),
(25, 'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями', 'ЦРГ 12', 1);

-- --------------------------------------------------------

--
-- Структура таблицы `CRGDesc`
--

CREATE TABLE `CRGDesc` (
  `id` int NOT NULL,
  `categoryId` int NOT NULL,
  `name` varchar(265) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `code` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Дамп данных таблицы `CRGDesc`
--

INSERT INTO `CRGDesc` (`id`, `categoryId`, `name`, `code`) VALUES
(1, 1, 'Инвалиды вследствие нарушений интеллектуального развития', 'ЦРГ 1.1'),
(2, 1, 'Инвалиды вследствие расстройств аутистического спектра', 'ЦРГ 1.2'),
(3, 1, 'Инвалиды вследствие экзогенно-органических расстройств, а также эпизодических и пароксизмальных расстройств', 'ЦРГ 1.3'),
(4, 1, 'Инвалиды вследствие эндогенных, аффективных, невротических и соматоформных расстройств', 'ЦРГ 1.4'),
(131, 3, 'Инвалиды вследствие слепоты или слабовидения', 'ЦРГ 3.1'),
(132, 3, 'Инвалиды вследствие глухоты или слабослышания', 'ЦРГ 3.2'),
(133, 3, 'Инвалиды вследствие сочетанных нарушений функций зрения и слуха', 'ЦРГ 3.3'),
(134, 4, 'Инвалиды вследствие церебрального паралича и других заболеваний, аномалий (пороков развития) центральной и периферической нервной системы, последствий травм периферической нервной системы, головного мозга и острых нарушений мозгового кровообращения', 'ЦРГ 4.1'),
(135, 4, 'Инвалиды вследствие заболеваний костно-мышечной системы, а также последствий травм и аномалий (пороков развития), деформаций опорно-двигательного аппарата', 'ЦРГ 4.2'),
(136, 4, 'Инвалиды вследствие врожденного или приобретенного отсутствия одной верхней конечности', 'ЦРГ 4.3'),
(137, 4, 'Инвалиды вследствие врожденного или приобретенного отсутствия обеих верхних конечностей', 'ЦРГ 4.4'),
(138, 4, 'Инвалиды вследствие врожденного или приобретенного отсутствия одной нижней конечности', 'ЦРГ 4.5'),
(139, 4, 'Инвалиды вследствие врожденного или приобретенного отсутствия обеих нижних конечностей', 'ЦРГ 4.6'),
(140, 4, 'Инвалиды вследствие спинальной травмы и связанных с ней повреждений спинного мозга', 'ЦРГ 4.7'),
(141, 12, 'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, вследствие приобретенного отсутствия (ампутации) одной верхней конечности', 'ЦРГ 12.1'),
(142, 12, 'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, вследствие приобретенного отсутствия (ампутации) обеих верхних конечностей', 'ЦРГ 12.2'),
(143, 12, 'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, вследствие приобретенного отсутствия (ампутации) одной нижней конечности', 'ЦРГ 12.3'),
(144, 12, 'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, вследствие приобретенного отсутствия (ампутации) обеих нижних конечностей', 'ЦРГ 12.4'),
(145, 12, 'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, с последствиями травм, термических и химических ожогов, отморожений конечностей с формированием анкилозов, контрактур и стягивающих рубцов', 'ЦРГ 12.5'),
(146, 12, 'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, с последствиями спинальной травмы и связанных с ней повреждений спинного мозга', 'ЦРГ 12.6'),
(147, 12, 'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, с последствиями поражения периферической нервной системы', 'ЦРГ 12.7'),
(148, 12, 'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, с последствиями поражения мозгового отдела черепа и головного мозга', 'ЦРГ 12.8'),
(149, 12, 'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, с последствиями поражения лицевого отдела черепа, в том числе с одновременным нарушением функций жевания, глотания, голосообразования, зрения или слуха', 'ЦРГ 12.9'),
(150, 12, 'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, с последствиями поражения органа зрения', 'ЦРГ 12.10'),
(151, 12, 'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, с последствиями поражения органа слуха', 'ЦРГ 12.11'),
(152, 12, 'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, с последствиями поражения внутренних органов, в том числе с аномальными отверстиями пищеварительного, мочевыделительного, дыхательного трактов', 'ЦРГ 12.12'),
(153, 12, 'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, с последствиями множественных ранений или комбинированной травмы с одновременными нарушениями различных функций организма человека', 'ЦРГ 12.13'),
(154, 13, 'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие приобретенного отсутствия (ампутации) одной верхней конечности', 'ЦРГ 13.1'),
(155, 13, 'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие приобретенного отсутствия (ампутации) обеих верхних конечностей', 'ЦРГ 13.2'),
(156, 13, 'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие приобретенного отсутствия (ампутации) одной нижней конечности', 'ЦРГ 13.3'),
(157, 13, 'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие приобретенного отсутствия обеих нижних конечностей', 'ЦРГ 13.4'),
(158, 13, 'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие травм, термических и химических ожогов, отморожений конечностей с формированием анкилозов, контрактур и стягивающих рубцов', 'ЦРГ 13.5'),
(159, 13, 'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие спинальной травмы и связанных с ней повреждений спинного мозга', 'ЦРГ 13.6'),
(160, 13, 'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие поражения периферической нервной системы', 'ЦРГ 13.7'),
(161, 13, 'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие поражения мозгового отдела черепа и головного мозга', 'ЦРГ 13.8'),
(162, 13, 'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие поражения лицевого отдела черепа, в том числе с одновременным нарушением функций жевания, глотания, голосообразования, зрения или слуха', 'ЦРГ 13.9'),
(163, 13, 'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие поражения органа зрения', 'ЦРГ 13.10'),
(164, 13, 'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие поражения органа слуха', 'ЦРГ 13.11'),
(165, 13, 'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие поражения внутренних органов, в том числе с аномальными отверстиями пищеварительного, мочевыделительного, дыхательного трактов', 'ЦРГ 13.12'),
(166, 13, 'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие комбинированной травмы или множественных ранений с одновременными нарушениями различных функций организма человека', 'ЦРГ 13.13'),
(167, 14, 'Ребенок-инвалид вследствие нарушений интеллектуального развития и расстройств развития учебных навыков', 'ЦРГ 1.1'),
(168, 14, 'Ребенок-инвалид вследствие расстройств аутистического спектра', 'ЦРГ 1.2'),
(169, 14, 'Ребенок-инвалид вследствие экзогенно-органических расстройств, а также эпизодических и пароксизмальных расстройств', 'ЦРГ 1.3'),
(170, 14, 'Ребенок-инвалид вследствие эндогенных, аффективных, невротических и соматоформных расстройств', 'ЦРГ 1.4'),
(171, 16, 'Ребенок-инвалид вследствие слепоты или слабовидения', 'ЦРГ 3.1'),
(172, 16, 'Ребенок-инвалид вследствие глухоты или слабослышания', 'ЦРГ 3.2'),
(173, 16, 'Ребенок-инвалид вследствие сочетанных нарушений функций зрения и слуха', 'ЦРГ 3.3'),
(174, 17, 'Ребенок-инвалид вследствие церебрального паралича и других заболеваний, аномалий (пороков развития) центральной и периферической нервной системы, последствий травм периферической нервной системы, головного мозга и острых нарушений мозгового кровообращения', 'ЦРГ 4.1'),
(175, 17, 'Ребенок-инвалид вследствие заболеваний костно-мышечной системы, а также последствий травм и аномалий (пороков развития), деформаций опорно-двигательного аппарата', 'ЦРГ 4.2'),
(176, 17, 'Ребенок-инвалид вследствие врожденного или приобретенного отсутствия одной верхней конечности', 'ЦРГ 4.3'),
(177, 17, 'Ребенок-инвалид вследствие врожденного или приобретенного отсутствия обеих верхних конечностей', 'ЦРГ 4.4'),
(178, 17, 'Ребенок-инвалид вследствие врожденного или приобретенного отсутствия одной нижней конечности', 'ЦРГ 4.5'),
(179, 17, 'Ребенок-инвалид вследствие врожденного или приобретенного отсутствия обеих нижних конечностей', 'ЦРГ 4.6'),
(180, 17, 'Ребенок-инвалид вследствие шейной или спинальной травмы и связанных с ней повреждений спинного мозга', 'ЦРГ 4.7'),
(181, 25, 'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие приобретенного отсутствия (ампутации) одной верхней конечности', 'ЦРГ 12.1'),
(182, 25, 'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие приобретенного отсутствия (ампутации) обеих верхних конечностей', 'ЦРГ 12.2'),
(183, 25, 'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие приобретенного отсутствия (ампутации) одной нижней конечности', 'ЦРГ 12.3'),
(184, 25, 'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие приобретенного отсутствия (ампутации) обеих нижних конечностей', 'ЦРГ 12.4'),
(185, 25, 'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие травм, термических и химических ожогов, отморожений конечностей с формированием анкилозов, контрактур и стягивающих рубцов', 'ЦРГ 12.5'),
(186, 25, 'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие спинальной травмы и связанных с ней повреждений спинного мозга', 'ЦРГ 12.6'),
(187, 25, 'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие поражения периферической нервной системы', 'ЦРГ 12.7'),
(188, 25, 'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие поражения мозгового отдела черепа и головного мозга', 'ЦРГ 12.8'),
(189, 25, 'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие поражения лицевого отдела черепа, в том числе с одновременным нарушением функций жевания, глотания, голосообразования, зрения или слуха', 'ЦРГ 12.9'),
(190, 25, 'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие поражения органа зрения', 'ЦРГ 12.10'),
(191, 25, 'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие поражения органа слуха', 'ЦРГ 12.11'),
(192, 25, 'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие поражения внутренних органов, в том числе с аномальными отверстиями пищеварительного, мочевыделительного, дыхательного трактов', 'ЦРГ 12.12'),
(193, 25, 'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие комбинированной травмы или множественных ранений с одновременными нарушениями различных функций организма человека', 'ЦРГ 12.13');

-- --------------------------------------------------------

--
-- Структура таблицы `CRGRecipientSec`
--

CREATE TABLE `CRGRecipientSec` (
  `idRecipient` int NOT NULL,
  `idCRGDesc` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `Direction`
--

CREATE TABLE `Direction` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `DocType`
--

CREATE TABLE `DocType` (
  `id` int NOT NULL,
  `code` varchar(100) NOT NULL,
  `name` varchar(128) NOT NULL,
  `category` enum('scan','generated','signed') NOT NULL,
  `isRequired` tinyint(1) NOT NULL,
  `appliesTo` enum('rehabilitant','representative','both') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `LegalRepresentatives`
--

CREATE TABLE `LegalRepresentatives` (
  `id` int NOT NULL,
  `firstName` varchar(50) NOT NULL,
  `middleName` varchar(50) NOT NULL,
  `lastName` varchar(50) NOT NULL,
  `telephone` varchar(20) NOT NULL,
  `email` varchar(50) NOT NULL,
  `passportSeries` char(4) NOT NULL,
  `passportNumber` char(6) NOT NULL,
  `passportIssuer` varchar(255) NOT NULL,
  `passportIssuerDate` date NOT NULL,
  `passportDeptCode` char(7) NOT NULL,
  `passportReg` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `Nozology`
--

CREATE TABLE `Nozology` (
  `id` int NOT NULL,
  `class` varchar(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Дамп данных таблицы `Nozology`
--

INSERT INTO `Nozology` (`id`, `class`, `name`, `code`) VALUES
(1, 'I', 'Некоторые инфекционные и паразитарные болезни', 'A00–B99'),
(2, 'II', 'Новообразования', 'C00–D48'),
(3, 'III', 'Болезни крови, кроветворных органов и отдельные нарушения, вовлекающие иммунный механизм', 'D50–D89'),
(4, 'IV', 'Болезни эндокринной системы, расстройства питания и нарушения обмена веществ', 'E00–E90'),
(5, 'V', 'Психические расстройства и расстройства поведения', 'F00–F99'),
(6, 'VI', 'Болезни нервной системы', 'G00–G99'),
(7, 'VII', 'Болезни глаза и его придаточного аппарата', 'H00–H59'),
(8, 'VIII', 'Некоторые инфекционные и паразитарные болезни', 'H60–H95'),
(9, 'IX', 'Болезни системы кровообращения', 'I00–I99'),
(10, 'X', 'Болезни органов дыхания', 'J00–J99'),
(11, 'XI', 'Болезни органов пищеварения', 'K00–K93'),
(12, 'XII', 'Болезни кожи и подкожной клетчатки', 'L00–L99'),
(13, 'XIII', 'Болезни костно-мышечной системы и соединительной ткани', 'M00–M99'),
(14, 'XIV', 'Болезни мочеполовой системы', 'N00–N99'),
(15, 'XV', 'Беременность, роды и послеродовой период', 'O00–O99'),
(16, 'XVI', 'Отдельные состояния, возникающие в перинатальном периоде', 'P00–P96'),
(17, 'XVII', 'Врождённые аномалии (пороки развития), деформации и хромосомные нарушения', 'Q00–Q99'),
(18, 'XVIII', 'Симптомы, признаки и отклонения от нормы, выявленные при клинических и лабораторных исследованиях, не классифицированные в других рубриках', 'R00–R99'),
(19, 'XIX', 'Травмы, отравления и некоторые другие последствия воздействия внешних причин', 'S00–T98'),
(20, 'XX', 'Внешние причины заболеваемости и смертности', 'V01–Y98'),
(21, 'XXI', 'Факторы, влияющие на состояние здоровья населения и обращения в учреждения здравоохранения', 'Z00–Z99');

-- --------------------------------------------------------

--
-- Структура таблицы `RecipientDocs`
--

CREATE TABLE `RecipientDocs` (
  `id` int NOT NULL,
  `recipientId` int NOT NULL,
  `docType` enum('Свидетельство','Паспорт') NOT NULL,
  `docSeries` varchar(16) NOT NULL,
  `docNumber` varchar(16) NOT NULL,
  `docIssuer` varchar(255) NOT NULL,
  `docIssuerDate` date NOT NULL,
  `snils` char(14) NOT NULL,
  `mseIssueDate` date NOT NULL,
  `mseValidDate` date NOT NULL,
  `regAddress` varchar(500) NOT NULL,
  `factAddress` varchar(500) NOT NULL,
  `factSameReg` tinyint(1) NOT NULL DEFAULT '0',
  `educationPlace` varchar(255) NOT NULL,
  `specialNote` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `Recipients`
--

CREATE TABLE `Recipients` (
  `id` int NOT NULL,
  `userId` int NOT NULL,
  `firstName` varchar(50) NOT NULL,
  `middleName` varchar(50) NOT NULL,
  `lastName` varchar(50) NOT NULL,
  `birthDate` date NOT NULL,
  `email` varchar(50) NOT NULL,
  `telephone` varchar(20) NOT NULL,
  `photo` blob NOT NULL,
  `representativeId` int NOT NULL,
  `status` enum('draft','active','archived') NOT NULL DEFAULT 'active',
  `disableGroup` enum('Ребенок-инвалид','I группа','II группа','III группа','Нет') NOT NULL DEFAULT 'Нет',
  `diagnosis` varchar(255) NOT NULL,
  `nozology` int NOT NULL,
  `groupId` int NOT NULL,
  `CRGMain` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `RecipientScanDocs`
--

CREATE TABLE `RecipientScanDocs` (
  `id` int NOT NULL,
  `entityType` enum('rehabilitant','representative') NOT NULL,
  `recipId` int NOT NULL,
  `represId` int NOT NULL,
  `docType` int NOT NULL,
  `storageKey` varchar(500) NOT NULL,
  `originalName` varchar(255) NOT NULL,
  `mimeType` varchar(100) NOT NULL,
  `sizeBytes` bigint UNSIGNED NOT NULL,
  `checksum_sha256` char(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `ReGroup`
--

CREATE TABLE `ReGroup` (
  `id` int NOT NULL,
  `groupName` varchar(50) NOT NULL,
  `curator` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `ReResults`
--

CREATE TABLE `ReResults` (
  `id` int NOT NULL,
  `idRecipient` int NOT NULL,
  `idDirection` int NOT NULL,
  `idSpecialist` int NOT NULL,
  `date` date NOT NULL,
  `results` json NOT NULL,
  `published` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `SpecialistDirect`
--

CREATE TABLE `SpecialistDirect` (
  `id` int NOT NULL,
  `idSpecialist` int NOT NULL,
  `idDirection` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `Specialists`
--

CREATE TABLE `Specialists` (
  `id` int NOT NULL,
  `fullName` varchar(150) NOT NULL,
  `dateBirth` date NOT NULL,
  `cabinet` varchar(3) NOT NULL,
  `telephone` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `Users`
--

CREATE TABLE `Users` (
  `id` int NOT NULL,
  `email` varchar(50) NOT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `role` enum('admin','teacher','employee','recipient') DEFAULT 'recipient'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Дамп данных таблицы `Users`
--

INSERT INTO `Users` (`id`, `email`, `passwordHash`, `role`) VALUES
(1, 'mininis@social.mos.ru', '$2a$10$S9p.FzVcu2vEbrxSagsTGu6G6wwGIh5YieF3Rx0ZRAthKD8xKt23.', 'admin');

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `CRG`
--
ALTER TABLE `CRG`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `CRGDesc`
--
ALTER TABLE `CRGDesc`
  ADD PRIMARY KEY (`id`),
  ADD KEY `categoryId` (`categoryId`);

--
-- Индексы таблицы `CRGRecipientSec`
--
ALTER TABLE `CRGRecipientSec`
  ADD KEY `idRecipient` (`idRecipient`),
  ADD KEY `idCRGDesc` (`idCRGDesc`);

--
-- Индексы таблицы `Direction`
--
ALTER TABLE `Direction`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `DocType`
--
ALTER TABLE `DocType`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `LegalRepresentatives`
--
ALTER TABLE `LegalRepresentatives`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `le_telephone` (`telephone`),
  ADD UNIQUE KEY `le_email` (`email`),
  ADD UNIQUE KEY `le_passport` (`passportSeries`,`passportNumber`);

--
-- Индексы таблицы `Nozology`
--
ALTER TABLE `Nozology`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `RecipientDocs`
--
ALTER TABLE `RecipientDocs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `re_snils` (`snils`),
  ADD KEY `recipientId` (`recipientId`);

--
-- Индексы таблицы `Recipients`
--
ALTER TABLE `Recipients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `re_telephone` (`telephone`),
  ADD UNIQUE KEY `re_email` (`email`),
  ADD KEY `nozology` (`nozology`),
  ADD KEY `CRGMain` (`CRGMain`),
  ADD KEY `groupId` (`groupId`),
  ADD KEY `userId` (`userId`),
  ADD KEY `representativeId` (`representativeId`);

--
-- Индексы таблицы `RecipientScanDocs`
--
ALTER TABLE `RecipientScanDocs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `recipId` (`recipId`),
  ADD KEY `represId` (`represId`),
  ADD KEY `docType` (`docType`);

--
-- Индексы таблицы `ReGroup`
--
ALTER TABLE `ReGroup`
  ADD PRIMARY KEY (`id`),
  ADD KEY `curator` (`curator`);

--
-- Индексы таблицы `ReResults`
--
ALTER TABLE `ReResults`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idRecipient` (`idRecipient`),
  ADD KEY `idSpecialist` (`idSpecialist`),
  ADD KEY `idDirection` (`idDirection`);

--
-- Индексы таблицы `SpecialistDirect`
--
ALTER TABLE `SpecialistDirect`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idSpecialist` (`idSpecialist`),
  ADD KEY `idDirection` (`idDirection`);

--
-- Индексы таблицы `Specialists`
--
ALTER TABLE `Specialists`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `spec_telephone` (`telephone`);

--
-- Индексы таблицы `Users`
--
ALTER TABLE `Users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `CRG`
--
ALTER TABLE `CRG`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT для таблицы `CRGDesc`
--
ALTER TABLE `CRGDesc`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=194;

--
-- AUTO_INCREMENT для таблицы `Direction`
--
ALTER TABLE `Direction`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `DocType`
--
ALTER TABLE `DocType`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `LegalRepresentatives`
--
ALTER TABLE `LegalRepresentatives`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `Nozology`
--
ALTER TABLE `Nozology`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT для таблицы `RecipientDocs`
--
ALTER TABLE `RecipientDocs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `Recipients`
--
ALTER TABLE `Recipients`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `RecipientScanDocs`
--
ALTER TABLE `RecipientScanDocs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `ReGroup`
--
ALTER TABLE `ReGroup`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `ReResults`
--
ALTER TABLE `ReResults`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `SpecialistDirect`
--
ALTER TABLE `SpecialistDirect`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `Specialists`
--
ALTER TABLE `Specialists`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `Users`
--
ALTER TABLE `Users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `CRGDesc`
--
ALTER TABLE `CRGDesc`
  ADD CONSTRAINT `crgdesc_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `CRG` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Ограничения внешнего ключа таблицы `CRGRecipientSec`
--
ALTER TABLE `CRGRecipientSec`
  ADD CONSTRAINT `crgrecipientsec_ibfk_1` FOREIGN KEY (`idRecipient`) REFERENCES `Recipients` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `crgrecipientsec_ibfk_2` FOREIGN KEY (`idCRGDesc`) REFERENCES `CRGDesc` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Ограничения внешнего ключа таблицы `RecipientDocs`
--
ALTER TABLE `RecipientDocs`
  ADD CONSTRAINT `recipientdocs_ibfk_1` FOREIGN KEY (`recipientId`) REFERENCES `Recipients` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Ограничения внешнего ключа таблицы `Recipients`
--
ALTER TABLE `Recipients`
  ADD CONSTRAINT `recipients_ibfk_1` FOREIGN KEY (`nozology`) REFERENCES `Nozology` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `recipients_ibfk_2` FOREIGN KEY (`CRGMain`) REFERENCES `CRG` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `recipients_ibfk_3` FOREIGN KEY (`groupId`) REFERENCES `ReGroup` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `recipients_ibfk_4` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `recipients_ibfk_5` FOREIGN KEY (`representativeId`) REFERENCES `LegalRepresentatives` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Ограничения внешнего ключа таблицы `RecipientScanDocs`
--
ALTER TABLE `RecipientScanDocs`
  ADD CONSTRAINT `recipientscandocs_ibfk_1` FOREIGN KEY (`recipId`) REFERENCES `Recipients` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `recipientscandocs_ibfk_2` FOREIGN KEY (`represId`) REFERENCES `LegalRepresentatives` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `recipientscandocs_ibfk_3` FOREIGN KEY (`docType`) REFERENCES `DocType` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Ограничения внешнего ключа таблицы `ReGroup`
--
ALTER TABLE `ReGroup`
  ADD CONSTRAINT `regroup_ibfk_1` FOREIGN KEY (`curator`) REFERENCES `Specialists` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Ограничения внешнего ключа таблицы `ReResults`
--
ALTER TABLE `ReResults`
  ADD CONSTRAINT `reresults_ibfk_1` FOREIGN KEY (`idRecipient`) REFERENCES `Recipients` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `reresults_ibfk_2` FOREIGN KEY (`idSpecialist`) REFERENCES `Specialists` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `reresults_ibfk_3` FOREIGN KEY (`idDirection`) REFERENCES `Direction` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Ограничения внешнего ключа таблицы `SpecialistDirect`
--
ALTER TABLE `SpecialistDirect`
  ADD CONSTRAINT `specialistdirect_ibfk_1` FOREIGN KEY (`idSpecialist`) REFERENCES `Specialists` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `specialistdirect_ibfk_2` FOREIGN KEY (`idDirection`) REFERENCES `Direction` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
