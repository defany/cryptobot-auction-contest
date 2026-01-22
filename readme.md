# Crypto Bot Auction Contest

## Ссылка на сайт проекта:
https://defany.github.io/cryptobot-auction-contest/

## Флоу аукционов:
[Флоу](./auction-flow.md) аукционов

## Результаты нагрузочного тестирования:
[Результаты](load_test/results.md) нагрузочного тестирования

## Архитектура проекта:
[Архитектура](./arch.md) проекта

## Осознанные допущения:
[Осознанные допущения](./known_issues.md) принятые при построении проекта

## Демо проекта:
[По ссылке](https://drive.google.com/file/d/12H7s93Pd6xvTh_NAzcec0TtAVi2yualR/view?usp=sharing)

### Запуск проекта:
В корне проекта: docker compose up --build -d предварительно перед этим прописав .env в server/client в соответствии с .env.example

Для запуска нагрузочных тестов достаточно поменять константы с айди гифта из бд и ссылкой до бекенда и прописать `k6 run load.js`